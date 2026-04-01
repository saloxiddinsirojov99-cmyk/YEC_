import { api } from './api';
import { canUseStorage, safeGet, safeSet } from '@/utils/safeStorage';

type LikedMap = Record<string, boolean>;

const LIKED_MAP_KEY = 'yec_like_map_v2';
const ACCESS_KEY = 'yec_token';

const hasAccessToken = () => {
  if (!canUseStorage()) return false;
  return Boolean(safeGet(ACCESS_KEY));
};

const readJson = <T>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  try {
    const raw = safeGet(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!canUseStorage()) return;
  safeSet(key, JSON.stringify(value));
};

const emitLikeChange = (detail: { id: string; liked?: boolean; count?: number }) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yec-like-changed', { detail }));
};

export const isCarpetLiked = (carpetId: string): boolean => {
  if (!hasAccessToken()) return false;
  const liked = readJson<LikedMap>(LIKED_MAP_KEY, {});
  return Boolean(liked[carpetId]);
};

export const likeCarpet = async (carpetId: string) => {
  if (!hasAccessToken()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return { liked: false, count: undefined };
  }

  const liked = readJson<LikedMap>(LIKED_MAP_KEY, {});
  const wasLiked = Boolean(liked[carpetId]);
  const optimisticLiked = !wasLiked;

  const setLikedInMap = (value: boolean) => {
    if (value) {
      liked[carpetId] = true;
    } else {
      delete liked[carpetId];
    }
  };

  // Optimistic local update
  setLikedInMap(optimisticLiked);

  writeJson(LIKED_MAP_KEY, liked);

  emitLikeChange({ id: carpetId, liked: optimisticLiked });

  let count: number | undefined;
  // Sync with backend API
  try {
    const { data } = await api.post(`/carpets/${carpetId}/like`);

    const serverLiked =
      typeof data?.liked === 'boolean' ? (data.liked as boolean) : optimisticLiked;
    if (typeof data?.likes === 'number') {
      count = data.likes;
    }

    // Trust backend response and sync local state
    setLikedInMap(serverLiked);
    writeJson(LIKED_MAP_KEY, liked);

    emitLikeChange({ id: carpetId, liked: serverLiked, count });
  } catch (err) {
    console.error('Failed to toggle like on backend', err);

    // Rollback optimistic local state so UI doesn't drift
    setLikedInMap(wasLiked);
    writeJson(LIKED_MAP_KEY, liked);
    emitLikeChange({ id: carpetId, liked: wasLiked });

    return { liked: wasLiked, count: undefined };
  }

  return { liked: Boolean(liked[carpetId]), count };
};
