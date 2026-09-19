import { create } from 'zustand';
import type { Carpet } from '@/types/carpet';

interface FavoritesState {
  favorites: Record<string, Carpet>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (carpet: Carpet) => void;
  getFavoritesList: () => Carpet[];
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: {},

  isFavorite: (id: string) => {
    return Boolean(get().favorites[id]);
  },

  toggleFavorite: (carpet: Carpet) => {
    set((state) => {
      const next = { ...state.favorites };
      if (next[carpet.id]) {
        delete next[carpet.id];
      } else {
        next[carpet.id] = carpet;
      }
      return { favorites: next };
    });
  },

  getFavoritesList: () => {
    return Object.values(get().favorites);
  },

  clearFavorites: () => {
    set({ favorites: {} });
  },
}));
