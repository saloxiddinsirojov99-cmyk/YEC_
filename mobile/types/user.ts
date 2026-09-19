import type { Order } from './order';

export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'CUSTOMER'
  | 'SELLER'
  | 'COURIER'
  | 'OPERATOR';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  address?: string;
  lat?: number;
  lng?: number;
  role: UserRole;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
  message?: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type UserProfile = AuthUser & {
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
  isTelegramLinked?: boolean;
  telegramJoinToken?: string;
};
