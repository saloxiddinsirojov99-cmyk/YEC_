import { create } from 'zustand';
import type { AuthUser } from '@/types/user';
import { getAccessToken, clearAuthTokens } from '@/lib/secure-storage';
import { getCurrentUserProfile, logout as apiLogout } from '@/services/auth.service';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  initializeAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: Boolean(user),
    });
  },

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await getAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isInitialized: true, isLoading: false });
        return;
      }

      const profile = await getCurrentUserProfile();
      set({
        user: profile,
        isAuthenticated: true,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      await clearAuthTokens();
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();
    } finally {
      await clearAuthTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
