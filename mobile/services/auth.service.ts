import { api } from './api';
import {
  setAccessToken,
  setRefreshToken,
  clearAuthTokens,
  getAccessToken,
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
};

export type RegisterOtpRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
};

export type VerifyRegisterOtpRequest = {
  email: string;
  otp: string;
};

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  address?: string;
  currentPassword?: string;
  newPassword?: string;
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

export async function requestRegisterOtp(
  payload: RegisterOtpRequest,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(
    '/auth/register/request-otp',
    payload,
  );
  return data;
}

export async function verifyRegisterOtp(
  payload: VerifyRegisterOtpRequest,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(
    '/auth/register/verify-otp',
    payload,
  );

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

export async function updateCurrentUserProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>('/users/me', payload);
  return data;
}

export async function hasValidSession(): Promise<boolean> {
  const token = await getAccessToken();
  return Boolean(token);
}
