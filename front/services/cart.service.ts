import type { CartItem } from '@/types/cart';
import { canUseStorage, safeGet, safeRemove, safeSet } from '@/utils/safeStorage';

const CART_KEY = 'yec_cart_items';
const CART_EVENT = 'yec-cart-changed';
const ACCESS_KEY = 'yec_token';

function hasAccessToken(): boolean {
  if (!canUseStorage()) return false;
  return Boolean(safeGet(ACCESS_KEY));
}

function redirectToLogin(): void {
  if (!canUseStorage()) return;
  window.location.href = '/login';
}

export function getCartItems(): CartItem[] {
  if (!canUseStorage()) return [];
  if (!hasAccessToken()) {
    safeRemove(CART_KEY);
    return [];
  }
  const raw = safeGet(CART_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCartItems(items: CartItem[]): void {
  if (!canUseStorage()) return;
  safeSet(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1): void {
  if (!hasAccessToken()) {
    redirectToLogin();
    return;
  }
  const items = getCartItems();
  const existing = items.find((cartItem) => cartItem.carpetId === item.carpetId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }

  setCartItems(items);
}

export function updateCartQuantity(carpetId: string, quantity: number): void {
  if (!hasAccessToken()) {
    redirectToLogin();
    return;
  }
  const items = getCartItems().map((item) =>
    item.carpetId === carpetId ? { ...item, quantity: Math.max(1, quantity) } : item,
  );
  setCartItems(items);
}

export function removeFromCart(carpetId: string): void {
  if (!hasAccessToken()) {
    redirectToLogin();
    return;
  }
  const items = getCartItems().filter((item) => item.carpetId !== carpetId);
  setCartItems(items);
}

export function clearCart(): void {
  if (!canUseStorage()) return;
  safeRemove(CART_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
