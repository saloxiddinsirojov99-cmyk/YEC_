import axios from 'axios';
import { clearToken, getRefreshToken, saveAccessToken } from './auth.service';
import { safeGet } from '@/utils/safeStorage';

const STATIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';

const isPrivateIpv4 = (hostname: string) => {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1') {
    return false;
  }
  const parts = normalized.split('.').map((value) => Number(value));
  if (parts.length !== 4 || parts.some((value) => !Number.isInteger(value))) {
    return false;
  }
  if (parts.some((value) => value < 0 || value > 255)) return false;
  const [a, b] = parts;
  if (a === 10 || (a === 192 && b === 168)) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
};

const resolveApiBaseUrl = () => {
  if (typeof window === 'undefined') return STATIC_API_BASE_URL;
  // Keep browser traffic on same-origin Next.js proxy to avoid LAN/network switch issues.
  return '/api/v1';
};

export const API_BASE_URL = resolveApiBaseUrl();

const MAX_RETRIES = 2;
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = safeGet('yec_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const resolveQueue = (token: string | null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};
    const status = error.response?.status;
    const method = String(originalRequest.method || '').toLowerCase();
    const isRetryable = RETRYABLE_METHODS.has(method);
    const hasResponse = Boolean(error.response);
    const retryCount = Number(originalRequest._retryCount || 0);

    if (!hasResponse && isRetryable && retryCount < MAX_RETRIES && !originalRequest.skipRetry) {
      originalRequest._retryCount = retryCount + 1;
      await sleep(500 * (retryCount + 1));
      return api(originalRequest);
    }

    if (
      hasResponse &&
      typeof status === 'number' &&
      RETRYABLE_STATUSES.has(status) &&
      isRetryable &&
      retryCount < MAX_RETRIES &&
      !originalRequest.skipRetry
    ) {
      originalRequest._retryCount = retryCount + 1;
      await sleep(500 * (retryCount + 1));
      return api(originalRequest);
    }

    if (status !== 401 || originalRequest._retry || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { timeout: 15000, headers: { 'x-skip-refresh': '1' } },
      );
      const newAccessToken = data?.accessToken;
      if (!newAccessToken) {
        throw new Error('No access token');
      }
      saveAccessToken(newAccessToken);
      resolveQueue(newAccessToken);
      originalRequest._retry = true;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolveQueue(null);
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function toFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof Blob) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string | string[]; errors?: string[] }
      | undefined;

    if (Array.isArray(responseData?.message)) {
      return responseData.message[0] ?? "So'rovda xatolik yuz berdi.";
    }

    if (typeof responseData?.message === 'string') {
      return responseData.message;
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
      return responseData.errors[0];
    }
  }

  return "Kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
}

export function formatPrice(value: number | string): string {
  const normalized =
    typeof value === 'string' ? Number(value.replace(/\s+/g, '').replace(/,/g, '.')) : Number(value);
  if (!Number.isFinite(normalized)) return `${value} so'm`;

  const rounded = Math.round(normalized);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded).toString();
  const formatted = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${formatted} so'm`;
}

const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || 
                      process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 
                      '').replace(/\/+$/, '');

/** Converts a relative /uploads/... path from the server to a full URL */
export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

  const normalized = trimmed.replace(/\\/g, '/');
  const lower = normalized.toLowerCase();

  const withoutLeading = normalized.replace(/^\/+/, '');
  const lowerWithoutLeading = withoutLeading.toLowerCase();

  // Frontend public assets - MUST return relative path WITHOUT backend prefix
  if (
    lowerWithoutLeading.startsWith('images/') ||
    lowerWithoutLeading.startsWith('logo') ||
    lowerWithoutLeading.startsWith('favicon') ||
    lowerWithoutLeading.startsWith('_next/')
  ) {
    return `/${withoutLeading}`;
  }

  let relativePath: string;

  // Absolute filesystem path or any path that contains /uploads/
  const uploadsIndex = lower.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    relativePath = normalized.slice(uploadsIndex);
  } else if (lowerWithoutLeading.startsWith('uploads/')) {
    relativePath = `/${withoutLeading}`;
  } else if (/^[^/]+\.(png|jpe?g|webp|gif|svg)$/i.test(withoutLeading)) {
    // Sometimes DB stores only filename
    relativePath = `/uploads/${withoutLeading}`;
  } else {
    // Fallback: treat as relative path
    relativePath = withoutLeading.startsWith('/') ? withoutLeading : `/${withoutLeading}`;
  }

  // Legacy format guard: some old rows may contain /upload/ instead of /uploads/
  relativePath = relativePath.replace(/^\/?upload\//i, '/uploads/');
  if (!relativePath.startsWith('/')) {
    relativePath = `/${relativePath}`;
  }

  // For uploads, we use relative path because Next.js rewrites will handle the proxy
  if (relativePath.startsWith('/uploads/')) {
    return relativePath;
  }

  // Double check if it's an image that we know is local
  if (relativePath.startsWith('/logo') || relativePath.startsWith('/favicon')) {
    return relativePath;
  }

  // Fallback to relative path for anything else (local assets or proxied)
  return relativePath;
}

