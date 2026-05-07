import type { Carpet } from '@/types/carpet';
import { getImageUrl } from '@/services/api';

/**
 * Fallback placeholder image shown when no carpet image is available.
 */
export const FALLBACK_CARPET_IMAGE = '/images/placeholder-carpet.svg';

/**
 * Normalizes a collection name into a URL-friendly slug.
 */
const normalizeCollectionSlug = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Given a carpet object, return a primary image URL and an optional fallback.
 *
 * Priority:
 * 1. First image in `carpet.images` resolved via `getImageUrl`
 * 2. A design-code-based auto-mapped image
 * 3. FALLBACK_CARPET_IMAGE
 */
export function getPrimaryCarpetImage(carpet: Carpet): {
  primary: string;
  fallback: string | null;
} {
  const images = carpet.images ?? [];

  // Try to resolve the first image from the images array
  for (const raw of images) {
    const resolved = getImageUrl(raw);
    if (resolved) {
      // Use the second image (if any) as fallback
      const secondResolved =
        images.length > 1 ? getImageUrl(images[1]) : null;
      return {
        primary: resolved,
        fallback: secondResolved ?? FALLBACK_CARPET_IMAGE,
      };
    }
  }

  // Try auto-mapped image from designCode
  const autoImage = getCollectionImageFromDesignCode(
    carpet.name,
    carpet.designCode ?? undefined,
  );
  if (autoImage) {
    return { primary: autoImage, fallback: FALLBACK_CARPET_IMAGE };
  }

  return { primary: FALLBACK_CARPET_IMAGE, fallback: null };
}

/**
 * Attempts to build a public image path from a collection name and design code.
 *
 * Assumes images are stored in /images/collections/<slug>/<designCode>.jpg
 * Returns null if inputs are insufficient.
 */
export function getCollectionImageFromDesignCode(
  collectionName: string,
  designCode?: string,
): string | null {
  const slug = normalizeCollectionSlug(collectionName);
  if (!slug) return null;
  if (!designCode || !designCode.trim()) return null;

  const code = designCode.trim();
  return `/images/collections/${slug}/${code}.jpg`;
}
