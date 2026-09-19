import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Carpet } from '@/types/carpet';
import { toggleCarpetLike, getLikedCarpets } from '@/services/carpet.service';
import { getAccessToken } from '@/lib/secure-storage';

interface FavoritesState {
  favorites: Record<string, Carpet>;
  isLoaded: boolean;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (carpet: Carpet) => Promise<void>;
  getFavoritesList: () => Carpet[];
  clearFavorites: () => void;
  loadFavorites: () => Promise<void>;
  saveFavorites: (favs: Record<string, Carpet>) => Promise<void>;
}

const FAVORITES_STORAGE_KEY = 'yec_mobile_favorites_v1';
const memoryFavorites = new Map<string, string>();

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return memoryFavorites.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      memoryFavorites.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('[FavoritesStore] Storage write error:', error);
  }
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: {},
  isLoaded: false,

  loadFavorites: async () => {
    try {
      const token = await getAccessToken();
      // If user is authenticated, sync with server
      if (token) {
        try {
          const serverLiked = await getLikedCarpets();
          if (Array.isArray(serverLiked)) {
            const mapped: Record<string, Carpet> = {};
            serverLiked.forEach((c) => {
              mapped[c.id] = c;
            });
            set({ favorites: mapped, isLoaded: true });
            await get().saveFavorites(mapped);
            return;
          }
        } catch {
          // Fallback to local storage if network fails
        }
      }

      // Read local favorites from persistent storage
      const raw = await getStorageItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          set({ favorites: parsed, isLoaded: true });
          return;
        }
      }
    } catch {
      // Safe recovery on storage corruption
    }
    set({ favorites: {}, isLoaded: true });
  },

  saveFavorites: async (favs: Record<string, Carpet>) => {
    await setStorageItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
  },

  isFavorite: (id: string) => {
    return Boolean(get().favorites[id]);
  },

  toggleFavorite: async (carpet: Carpet) => {
    const isFav = Boolean(get().favorites[carpet.id]);
    const next = { ...get().favorites };

    if (isFav) {
      delete next[carpet.id];
    } else {
      next[carpet.id] = carpet;
    }

    // Optimistic update
    set({ favorites: next });
    await get().saveFavorites(next);

    // If authenticated, sync with backend
    try {
      const token = await getAccessToken();
      if (token) {
        await toggleCarpetLike(carpet.id);
      }
    } catch (err) {
      console.warn('Backend like sync failed, preserved locally');
    }
  },

  getFavoritesList: () => {
    return Object.values(get().favorites);
  },

  clearFavorites: () => {
    set({ favorites: {} });
    get().saveFavorites({});
  },
}));
