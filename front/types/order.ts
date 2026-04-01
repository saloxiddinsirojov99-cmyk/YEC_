import type { Carpet } from './carpet';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'ON_WAY' | 'DELIVERED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD';

export type OrderItem = {
  id: string;
  orderId: string;
  carpetId: string;
  quantity: number;
  price: number | string;
  carpet?: Carpet;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  phone2?: string | null;
  address: string;
  locationLat?: number | null;
  locationLng?: number | null;
  locationText?: string | null;
  paymentMethod?: PaymentMethod | null;
  appliedPromoCode?: string | null;
  appliedPromoPercent?: number | null;
  appliedPromoType?: 'DISCOUNT' | 'GIFT' | null;
  appliedPromoGiftName?: string | null;
  appliedPromoGiftImage?: string | null;
  appliedPromoGiftPrice?: number | null;
  comment?: string | null;
  cancelReason?: string | null;
  status: OrderStatus;
  deliveryDate?: string | null;
  explanation?: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type OrderListResponse = {
  items: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
