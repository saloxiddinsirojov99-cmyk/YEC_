import { api } from './api';
import type { UserProfile } from '@/types/user';

export async function getMyProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>('/users/me');
  return data;
}

export async function updateMyProfile(payload: { 
  name?: string; 
  phone?: string; 
  avatar?: string;
  address?: string;
  lat?: number;
  lng?: number;
}) {
  const { data } = await api.patch('/users/me', payload);
  return data;
}

export async function getAdminStats() {
  const { data } = await api.get('/users/stats');
  return data;
}
