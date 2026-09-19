import { create } from 'zustand';
import type { CartItem } from '@/types/cart';

interface CartState {
  items: CartItem[];
  
  // Computed values
  totalCount: () => number;
  totalPrice: () => number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (carpetId: string) => void;
  updateQuantity: (carpetId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  totalCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  totalPrice: () => {
    return get().items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0,
    );
  },

  addItem: (item: CartItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex(
        (i) => i.carpetId === item.carpetId,
      );

      if (existingIndex > -1) {
        const updated = [...state.items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return { items: updated };
      }

      return { items: [...state.items, item] };
    });
  },

  removeItem: (carpetId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.carpetId !== carpetId),
    }));
  },

  updateQuantity: (carpetId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(carpetId);
      return;
    }

    set((state) => ({
      items: state.items.map((i) =>
        i.carpetId === carpetId ? { ...i, quantity } : i,
      ),
    }));
  },

  clearCart: () => {
    set({ items: [] });
  },
}));
