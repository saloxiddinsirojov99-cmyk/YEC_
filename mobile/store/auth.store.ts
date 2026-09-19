import { create } from 'zustand';
import type { AuthUser, UserProfile } from '@/types/user';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  type LoginCredentials,
  type UpdateProfilePayload,
} from '@/services/auth.service';
import { getAccessToken, clearAuthTokens } from '@/lib/secure-storage';

interface AuthState {
  user: AuthUser | UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  restoreSession: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (payload: UpdateProfilePayload) => Promise<UserProfile>;
  setUser: (user: AuthUser | UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  restoreSession: async () => {
    try {
      set({ isLoading: true });
      const token = await getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Fetch active user profile from production backend
      const profile = await getCurrentUserProfile();
      set({ user: profile, isAuthenticated: true, isLoading: false });
    } catch (error) {
      // If token is invalid/expired and refresh failed in interceptor
      await clearAuthTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials: LoginCredentials) => {
    const res = await apiLogin(credentials);
    set({ user: res.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      await clearAuthTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  updateUser: async (payload: UpdateProfilePayload) => {
    const updated = await updateCurrentUserProfile(payload);
    set({ user: updated });
    return updated;
  },

  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
  },
}));
