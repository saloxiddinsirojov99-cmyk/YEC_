export function clampDiscountPercent(value: unknown): number {
  const parsed = Math.round(Number(value ?? 0));
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(99, Math.max(0, parsed));
}

export function getDiscountedPrice(
  price: number | string,
  discountPercent: unknown,
): number {
  const basePrice = Number(price);
  if (!Number.isFinite(basePrice)) return 0;

  const percent = clampDiscountPercent(discountPercent);
  if (percent <= 0) return Math.round(basePrice);

  return Math.round((basePrice * (100 - percent)) / 100);
}

export function formatPrice(value: number | string): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0 soʻm';

  return (
    new Intl.NumberFormat('uz-UZ', {
      maximumFractionDigits: 0,
    })
      .format(Math.round(num))
      .replace(/,/g, ' ') + ' soʻm'
  );
}
