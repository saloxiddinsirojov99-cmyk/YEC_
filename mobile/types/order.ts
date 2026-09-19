import type { Carpet } from './carpet';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'CUTTING'
  | 'READY_FOR_DELIVERY'
  | 'ON_WAY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCEL_REQUESTED'
  | 'RETURN_REQUESTED'
  | 'RETURN_APPROVED'
  | 'RETURN_REJECTED'
  | 'REFUNDED';

export type PaymentMethod = 'CASH' | 'CARD' | 'CLICK' | 'PAYME';

export type OrderItem = {
  id: string;
  orderId: string;
  carpetId: string;
  quantity: number;
  price: number | string;
  carpet?: Carpet;
  rollAllocation?: any;
  pricePerM2?: number | string;
  selectedArea?: number | string;
  selectedWidthCm?: number;
  selectedLengthCm?: number;
  carpetName?: string;
  carpetImage?: string;
  carpetBarcode?: string;
  isReturnedInventoryCreated?: boolean;
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
  deliveryCompletedAt?: string | null;
  returnRequest?: any;
  createdAt: string;
  items: OrderItem[];
  depositAmount?: number | string | null;
  depositPercent?: number | null;
  depositPaidAt?: string | null;
  depositPaymentMethod?: string | null;
  depositTransactionId?: string | null;
  paymentTransactions?: any[];
  returnDeadline?: string | null;
  version: number;
  courierProofType?: string | null;
  courierProofData?: string | null;
  courierProofSignature?: string | null;
};

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
  locationLat?: number;
  locationLng?: number;
  locationText?: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  comment?: string;
  items: CreateOrderItemPayload[];
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
