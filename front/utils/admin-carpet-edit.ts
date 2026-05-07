import type { Carpet } from '@/types/carpet';

/**
 * Build the admin edit URL for a given carpet.
 * Routes to the admin carpet create/edit page with the carpet ID as a query param.
 */
export function buildAdminCarpetEditUrl(carpet: Carpet): string {
  if (!carpet?.id) return '/admin/carpets';
  return `/admin/carpets/create?id=${encodeURIComponent(carpet.id)}`;
}
