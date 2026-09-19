import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL, API_TIMEOUT_MS, CLIENT_PLATFORM } from '@/constants/config';
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAuthTokens,
} from '@/lib/secure-storage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'x-client-platform': CLIENT_PLATFORM,
  },
});

// Request Interceptor: Attach Bearer token and platform header
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ensure mobile platform header is always present
    config.headers.set('x-client-platform', CLIENT_PLATFORM);

    const token = await getAccessToken();
    if (token && !config.headers.has('Authorization')) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: 401 Refresh Token Queue Architecture
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized for authenticated requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the 401 is coming from the refresh endpoint itself, logout and fail
      if (originalRequest.url?.includes('/auth/refresh')) {
        await clearAuthTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest._retry = true;
            originalRequest.headers.set('Authorization', `Bearer ${token}`);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await getRefreshToken();

        if (!storedRefreshToken) {
          await clearAuthTokens();
          processQueue(new Error('No refresh token available'), null);
          return Promise.reject(error);
        }

        // Call backend refresh endpoint with mobile client platform header
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken?: string;
        }>(
          `${API_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-client-platform': CLIENT_PLATFORM,
            },
            timeout: API_TIMEOUT_MS,
          },
        );

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken || storedRefreshToken;

        await setAccessToken(newAccessToken);
        if (newRefreshToken) {
          await setRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);

        originalRequest.headers.set(
          'Authorization',
          `Bearer ${newAccessToken}`,
        );
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await clearAuthTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Utility to extract user-friendly error message from Axios errors
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      const msg = error.response.data.message;
      return Array.isArray(msg) ? msg.join(', ') : String(msg);
    }
    if (error.code === 'ECONNABORTED') {
      return 'Serverga ulanish vaqti tugadi (Timeout).';
    }
    if (!error.response) {
      return 'Tarmoq xatosi. Internet aloqasini tekshiring.';
    }
    return `Server xatosi: ${error.response.status}`;
  }
  return 'Kutilmagan xatolik yuz berdi.';
}
