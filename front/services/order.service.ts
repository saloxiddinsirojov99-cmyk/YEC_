import { api } from './api';
import type { OrderListResponse, Order } from '@/types/order';

export type CreateOrderPayload = {
  customerName: string;
  phone: string;
  phone2: string;
  address: string;
  locationLat: number;
  locationLng: number;
  locationText: string;
  paymentMethod: 'CASH' | 'CARD';
  comment?: string;
  promoCode?: string;
  items: Array<{
    carpetId: string;
    quantity: number;
  }>;
};

export type PromoPreviewPayload = {
  promoCode?: string;
  items: Array<{
    carpetId: string;
    quantity: number;
  }>;
};

export type PromoPreviewResponse = {
  state: 'empty' | 'invalid' | 'valid';
  message: string;
  promo:
    | {
        code?: string;
        type?: 'DISCOUNT' | 'GIFT';
        discountPercent?: number;
        minOrderAmount?: number;
        giftName?: string | null;
        giftImage?: string | null;
        giftPrice?: number | null;
      }
    | null;
  pricing: {
    totalOriginalAmount: number;
    subtotalAfterCarpetDiscount: number;
    totalAfterPromo: number;
    productDiscountAmount: number;
    promoDiscountAmount: number;
    totalDiscountAmount: number;
    totalDiscountPercent: number;
    items: Array<{
      carpetId: string;
      carpetName: string;
      quantity: number;
      originalUnitPrice: number;
      carpetDiscountPercent: number;
      unitPriceAfterCarpetDiscount: number;
      promoDiscountPercent: number;
      unitPriceAfterPromo: number;
      lineOriginalTotal: number;
      lineAfterCarpetDiscountTotal: number;
      lineTotal: number;
      lineProductDiscountAmount: number;
      linePromoDiscountAmount: number;
      lineTotalDiscountAmount: number;
    }>;
  };
};

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post('/orders', payload);
  return data;
}

export async function previewPromoCode(payload: PromoPreviewPayload) {
  const { data } = await api.post<PromoPreviewResponse>('/orders/promo-preview', payload);
  return data;
}

export async function getMyOrders(params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<OrderListResponse>('/orders/my', { params });
  return data;
}

export async function getOrderById(id: string) {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export async function confirmOrderDelivery(id: string) {
  const { data } = await api.patch(`/orders/${id}/confirm-delivery`);
  return data;
}
export async function cancelOrder(id: string) {
  const { data } = await api.patch(`/orders/${id}/cancel`);
  return data;
}
