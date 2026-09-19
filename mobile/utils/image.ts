import { BACKEND_ROOT_URL, ASSETS_CDN_BASE_URL } from '@/constants/config';

// Premium fallback placeholder when no image is available
export const FALLBACK_CARPET_IMAGE =
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80';

/**
 * Normalizes a collection name into a URL-friendly slug.
 */
export function normalizeCollectionSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

  // Server uploads stored on Render backend
  if (normalized.startsWith('/uploads/')) {
    return `${BACKEND_ROOT_URL}${normalized}`;
  }

  // Static collection images (/images/collections/...)
  if (normalized.startsWith('/images/')) {
    return `${ASSETS_CDN_BASE_URL}${normalized}`;
  }

  return `${ASSETS_CDN_BASE_URL}${normalized}`;
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

/**
 * Constructs an image URL from collection name and design code if carpet.images is empty.
 */
export function getCollectionImageByCode(
  collectionName: string,
  designCode?: string | null,
): string {
  if (!collectionName || !designCode) {
    return FALLBACK_CARPET_IMAGE;
  }
  const slug = normalizeCollectionSlug(collectionName);
  const code = designCode.trim();
  return `${ASSETS_CDN_BASE_URL}/images/collections/${slug}/${code}.jpg`;
}
