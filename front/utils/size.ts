export const parseAreaFromSize = (size: string): number | null => {
  if (!size) return null;

  const normalized = size.toLowerCase().replace(/,/g, '.');
  const matches = normalized.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return null;

  const numbers = matches.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return null;

  if (numbers.length === 1) {
    const value = numbers[0];
    return value > 0 ? value : null;
  }

  const [rawA, rawB] = numbers;
  const hasCm = normalized.includes('cm') || normalized.includes('см');
  const useCm = hasCm || rawA > 20 || rawB > 20;
  const a = useCm ? rawA / 100 : rawA;
  const b = useCm ? rawB / 100 : rawB;
  const area = a * b;

  return area > 0 ? area : null;
};

export const normalizeSizeKey = (size: string): string => {
  if (!size) return '';

  const normalized = size.toLowerCase().replace(/,/g, '.');
  const matches = normalized.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return '';

  const numbers = matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (numbers.length === 0) return '';

  const sorted = [...numbers].sort((a, b) => a - b);
  const hasCm = normalized.includes('cm') || normalized.includes('\u0441\u043c');
  const useCm = hasCm || sorted.some((value) => value > 20);
  const normalizedDims = sorted.map((value) => (useCm ? value : value * 100));

  return normalizedDims.map((value) => Math.round(value)).join('x');
};

export const getPricePerM2 = (totalPrice: number | string, size: string): number | null => {
  const area = parseAreaFromSize(size);
  if (!area) return null;

  const price = Number(totalPrice);
  if (!Number.isFinite(price) || price <= 0) return null;

  return price / area;
};
