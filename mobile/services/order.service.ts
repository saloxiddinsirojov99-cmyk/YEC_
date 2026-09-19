import { api } from './api';
import type {
  Order,
  OrderListResponse,
  PaymentMethod,
} from '@/types/order';

export type CreateOrderItemPayload = {
  carpetId: string;
  quantity: number;
  widthCm?: number;
  lengthCm?: number;
};

export type CreateOrderPayload = {
  customerName: string;
  phone: string;
  phone2?: string;
  address: string;
  locationLat: number;
  locationLng: number;
  locationText: string;
  paymentMethod: PaymentMethod;
  comment?: string;
  promoCode?: string;
  items: CreateOrderItemPayload[];
  termsAccepted?: boolean;
};

export type OrderQueryDto = {
  page?: number;
  limit?: number;
  status?: string;
};

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const { data } = await api.post<Order>('/orders', payload);
  return data;
}

export async function getMyOrders(query: OrderQueryDto = {}): Promise<OrderListResponse> {
  const { data } = await api.get<OrderListResponse>('/orders/my', {
    params: query,
  });
  return data;
}

export async function getOrderById(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/orders/${id}`);
  return data;
}

export type PromoPreviewResponse = {
  state: 'empty' | 'invalid' | 'valid';
  message: string;
  promo: {
    code?: string;
    type?: 'DISCOUNT' | 'GIFT';
    discountPercent?: number;
    minOrderAmount?: number;
    giftName?: string | null;
    giftImage?: string | null;
    giftPrice?: number | null;
  } | null;
  pricing: {
    totalOriginalAmount: number;
    subtotalAfterCarpetDiscount: number;
    totalAfterPromo: number;
    productDiscountAmount: number;
    promoDiscountAmount: number;
    totalDiscountAmount: number;
    totalDiscountPercent: number;
    items?: Array<{
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

export async function previewPromoCode(payload: {
  promoCode?: string;
  items: Array<{ carpetId: string; quantity: number }>;
}): Promise<PromoPreviewResponse> {
  const { data } = await api.post<PromoPreviewResponse>('/orders/promo-preview', payload);
  return data;
}

