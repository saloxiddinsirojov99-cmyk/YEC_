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

export async function previewPromoCode(payload: {
  promoCode?: string;
  items: Array<{ carpetId: string; quantity: number }>;
}): Promise<any> {
  const { data } = await api.post('/orders/promo-preview', payload);
  return data;
}
