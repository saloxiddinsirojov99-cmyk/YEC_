import { api } from './api';
import { API_BASE_URL } from './api';
import type { LoginResponse } from '@/types/user';
import { canUseStorage, safeGet, safeRemove, safeSet } from '@/utils/safeStorage';

export type RegisterOtpRequestPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterOtpVerifyPayload = {
  email: string;
  otp: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

export async function requestRegisterOtp(payload: RegisterOtpRequestPayload) {
  const { data } = await api.post<{
    message: string;
    devOtpCode?: string;
  }>('/auth/register', payload);

  return data;
}

export async function verifyRegisterOtp(payload: RegisterOtpVerifyPayload) {
  const { data } = await api.post<{
    message: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
    };
  }>('/auth/register/verify-otp', payload);

  return data;
}

export async function login(payload: LoginPayload) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function requestForgotPassword(email: string) {
  const { data } = await api.post<{ message: string; devOtpCode?: string }>(
    '/auth/forgot-password/request-otp',
    { email },
  );
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password/reset', payload);
  return data;
}

export function getGoogleLoginUrl(): string {
  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${base}/auth/google`;
}

const ACCESS_KEY = 'yec_token';
const REFRESH_KEY = 'yec_refresh_token';
const LAST_ACTIVE_KEY = 'yec_last_active';
const LIKED_MAP_KEY = 'yec_like_map_v2';
const CART_KEY = 'yec_cart_items';

export function saveTokens(accessToken: string, refreshToken?: string) {
  if (!canUseStorage()) return;
  safeSet(ACCESS_KEY, accessToken);
  if (refreshToken) {
    safeSet(REFRESH_KEY, refreshToken);
  }
  safeSet(LAST_ACTIVE_KEY, String(Date.now()));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yec-auth-changed'));
  }
}

export function saveAccessToken(accessToken: string) {
  if (!canUseStorage()) return;
  safeSet(ACCESS_KEY, accessToken);
  safeSet(LAST_ACTIVE_KEY, String(Date.now()));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yec-auth-changed'));
  }
}

export function clearToken() {
  if (!canUseStorage()) return;
  safeRemove(ACCESS_KEY);
  safeRemove(REFRESH_KEY);
  safeRemove(LAST_ACTIVE_KEY);
  safeRemove(LIKED_MAP_KEY);
  safeRemove(CART_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('yec-auth-changed'));
    window.dispatchEvent(new CustomEvent('yec-like-changed', { detail: { id: '' } }));
    window.dispatchEvent(new Event('yec-cart-changed'));
  }
}

export function getToken(): string | null {
  if (!canUseStorage()) return null;
  return safeGet(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!canUseStorage()) return null;
  return safeGet(REFRESH_KEY);
}

export function setLastActive(ts: number) {
  if (!canUseStorage()) return;
  safeSet(LAST_ACTIVE_KEY, String(ts));
}

export function getLastActive(): number {
  if (!canUseStorage()) return Date.now();
  const raw = safeGet(LAST_ACTIVE_KEY);
  const parsed = raw ? Number(raw) : Date.now();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export type DecodedToken = {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
};

export function getUserFromToken(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(jsonPayload) as DecodedToken;
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }
}

export function getTokenExpiryMs(token: string | null): number | null {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload) as { exp?: number };
    if (!payload?.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}
