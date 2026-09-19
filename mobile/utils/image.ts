import { BACKEND_ROOT_URL } from '@/constants/config';

// Fallback high-quality carpet placeholder
export const FALLBACK_CARPET_IMAGE =
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80';

/**
 * Resolves any relative or absolute image path into a valid HTTPS URL suitable for mobile.
 */
export function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return FALLBACK_CARPET_IMAGE;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return FALLBACK_CARPET_IMAGE;
  }

  // Already an absolute HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Normalized path with leading slash
  let normalized = trimmed.replace(/\\/g, '/');
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  // Legacy /upload/ -> /uploads/
  normalized = normalized.replace(/^\/upload\//i, '/uploads/');

  // Server uploads stored on backend
  if (normalized.startsWith('/uploads/')) {
    return `${BACKEND_ROOT_URL}${normalized}`;
  }

  // Web collection images (static web or backend static)
  if (normalized.startsWith('/images/')) {
    return `${BACKEND_ROOT_URL}${normalized}`;
  }

  // Default fallback: attach to backend root
  return `${BACKEND_ROOT_URL}${normalized}`;
}

/**
 * Gets the primary image URL for a carpet with graceful fallback.
 */
export function getPrimaryCarpetImageUrl(images?: string[] | null): string {
  if (images && images.length > 0) {
    for (const img of images) {
      if (img && typeof img === 'string' && img.trim().length > 0) {
        return resolveImageUrl(img);
      }
    }
  }
  return FALLBACK_CARPET_IMAGE;
}
