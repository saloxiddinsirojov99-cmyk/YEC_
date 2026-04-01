export const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Ensure it starts with 998 or prepends it if missing
  let localDigits = '';
  if (digits.startsWith('998')) {
    localDigits = digits.slice(3, 12); // Max 9 digits for local part
  } else {
    localDigits = digits.slice(0, 9);
  }

  let result = '+998 ';
  if (localDigits.length > 0) {
    result += localDigits.slice(0, 2);
  }
  if (localDigits.length > 2) {
    result += '-' + localDigits.slice(2, 5);
  }
  if (localDigits.length > 5) {
    result += '-' + localDigits.slice(5, 7);
  }
  if (localDigits.length > 7) {
    result += '-' + localDigits.slice(7, 9);
  }
  
  return result;
};

export const normalizePhoneNumber = (value: string) => {
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
) => {
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

import { OrderStatus } from '@/types/order';

export const formatOrderStatus = (status: OrderStatus) => {
  const statuses: Record<OrderStatus, string> = {
    PENDING: 'Kutilmoqda',
    ACCEPTED: 'Qabul qilindi',
    ON_WAY: 'Yetkazib berilmoqda',
    DELIVERED: 'Yetkazib berildi',
    CANCELLED: 'Bekor qilindi',
  };

  return statuses[status] || status;
};
