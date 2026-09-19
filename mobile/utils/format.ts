import type { OrderStatus } from '@/types/order';

export const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');

  let localDigits = '';
  if (digits.startsWith('998')) {
    localDigits = digits.slice(3, 12);
  } else {
    localDigits = digits.slice(0, 9);
  }

  let result = '+998 ';
  if (localDigits.length > 0) {
    result += localDigits.slice(0, 2);
  }
  if (localDigits.length > 2) {
    result += ' ' + localDigits.slice(2, 5);
  }
  if (localDigits.length > 5) {
    result += '-' + localDigits.slice(5, 7);
  }
  if (localDigits.length > 7) {
    result += '-' + localDigits.slice(7, 9);
  }

  return result;
};

export const normalizePhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');

  let localDigits = '';
  if (digits.startsWith('998')) {
    localDigits = digits.slice(3, 12);
  } else {
    localDigits = digits.slice(0, 9);
  }

  return `+998${localDigits}`;
};

export const formatOrderNumber = (
  id: string,
  createdAt?: string | Date | null,
): string => {
  const safeId = String(id ?? '');
  let timestamp = '';

  if (createdAt) {
    const parsed = createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      timestamp = parsed.toISOString();
    }
  }

  const seed = `${safeId}|${timestamp}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const normalized = (hash >>> 0) % 1000000;
  return normalized.toString().padStart(6, '0');
};

export const formatOrderStatus = (status: OrderStatus): string => {
  const statuses: Record<OrderStatus, string> = {
    PENDING: 'Yangi buyurtma',
    ACCEPTED: 'Tasdiqlandi',
    CUTTING: 'Kesilmoqda',
    READY_FOR_DELIVERY: 'Yetkazib berishga tayyor',
    ON_WAY: "Yo'lda (Kuryer)",
    DELIVERED: 'Yetkazib berildi',
    COMPLETED: 'Yakunlandi',
    CANCELLED: 'Bekor qilindi',
    CANCEL_REQUESTED: 'Bekor qilish so‘raldi',
    RETURN_REQUESTED: 'Qaytarish so‘rovi',
    RETURN_APPROVED: 'Qaytarish tasdiqlandi',
    RETURN_REJECTED: 'Qaytarish rad etildi',
    REFUNDED: 'Mablag‘ qaytarildi',
  };

  return statuses[status] || status;
};
