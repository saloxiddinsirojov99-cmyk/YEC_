import { api } from './api';
import {
  setAccessToken,
  setRefreshToken,
  clearAuthTokens,
} from '@/lib/secure-storage';
import type {
  AuthUser,
  LoginResponse,
  UserProfile,
} from '@/types/user';

export type LoginCredentials = {
  email?: string;
  phone?: string;
  password?: string;
  code?: string;
};

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);

  if (data.accessToken) {
    await setAccessToken(data.accessToken);
  }
  if (data.refreshToken) {
    await setRefreshToken(data.refreshToken);
  }

  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Ignore server error on logout if token is already expired
  } finally {
    await clearAuthTokens();
  }
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/users/me');
  return data;
}
