import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface CartLineItem {
  /** Unique key: carpetId for ready carpet, or `${carpetId}_${widthCm}_${lengthCm}` for custom roll cuts */
  id: string;
  carpetId: string;
  name: string;
  price: number; // Unit price (for ready) or calculated item price
  image?: string;
  size?: string;
  material?: string;
  quantity: number;
  stock?: number;
  // Custom Roll (Metraj) specifics:
  isRoll?: boolean;
  widthCm?: number;
  lengthCm?: number;
  areaM2?: number;
  pricePerM2?: number;
}

interface CartState {
  items: CartLineItem[];
  isLoaded: boolean;
  addItem: (item: Omit<CartLineItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  loadCart: () => Promise<void>;
  saveCart: (items: CartLineItem[]) => Promise<void>;
  getTotalCount: () => number;
  getSubtotal: () => number;
}

const CART_STORAGE_KEY = 'yec_mobile_cart_v1';
const memoryCart = new Map<string, string>();

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return memoryCart.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      memoryCart.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('[CartStore] Storage write error:', error);
  }
}

function generateLineId(carpetId: string, widthCm?: number, lengthCm?: number): string {
  if (widthCm && lengthCm) {
    return `${carpetId}_w${widthCm}_l${lengthCm}`;
  }
  return carpetId;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoaded: false,

  loadCart: async () => {
    try {
      const raw = await getStorageItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ items: parsed, isLoaded: true });
          return;
        }
      }
    } catch {
      // Safe recovery on storage corruption
    }
    set({ items: [], isLoaded: true });
  },

  saveCart: async (items: CartLineItem[]) => {
    await setStorageItem(CART_STORAGE_KEY, JSON.stringify(items));
  },

  addItem: (newItem) => {
    const lineId = generateLineId(newItem.carpetId, newItem.widthCm, newItem.lengthCm);
    const existing = get().items.find((i) => i.id === lineId);

    let updated: CartLineItem[];
    if (existing) {
      // Increase quantity, respecting stock if provided
      const maxStock = existing.stock ?? 999;
      const newQty = Math.min(existing.quantity + newItem.quantity, maxStock);
      updated = get().items.map((i) =>
        i.id === lineId ? { ...i, quantity: newQty } : i,
      );
    } else {
      updated = [...get().items, { ...newItem, id: lineId }];
    }

    set({ items: updated });
    get().saveCart(updated);
  },

  removeItem: (id: string) => {
    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
    get().saveCart(updated);
  },

  updateQuantity: (id: string, delta: number) => {
    const updated = get()
      .items.map((item) => {
        if (item.id !== id) return item;
        const newQty = item.quantity + delta;
        const maxStock = item.stock ?? 999;
        if (newQty <= 0) return null;
        return { ...item, quantity: Math.min(newQty, maxStock) };
      })
      .filter((item): item is CartLineItem => item !== null);

    set({ items: updated });
    get().saveCart(updated);
  },

  clearCart: () => {
    set({ items: [] });
    get().saveCart([]);
  },

  getTotalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      if (item.isRoll && item.pricePerM2 && item.widthCm && item.lengthCm) {
        const areaM2 = (item.widthCm / 100) * (item.lengthCm / 100);
        return sum + Math.round(areaM2 * item.pricePerM2) * item.quantity;
      }
      return sum + item.price * item.quantity;
    }, 0);
  },
}));
