export const parseAreaFromSize = (size: string): number | null => {
  if (!size) return null;

  const normalized = size.toLowerCase().replace(/,/g, '.');
  const matches = normalized.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length === 0) return null;

  const numbers = matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
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
  const hasCm =
    normalized.includes('cm') || normalized.includes('\u0441\u043c');
  const useCm = hasCm || sorted.some((value) => value > 20);
  const normalizedDims = sorted.map((value) => (useCm ? value : value * 100));

  return normalizedDims.map((value) => Math.round(value)).join('x');
};

export const getPricePerM2 = (
  totalPrice: number | string,
  size: string,
): number | null => {
  const area = parseAreaFromSize(size);
  if (!area) return null;

  const price = Number(totalPrice);
  if (!Number.isFinite(price) || price <= 0) return null;

  return price / area;
};

export const isSizeComplete = (size: string | null | undefined): boolean => {
  if (!size) return true;
  const s = size.trim();
  if (!s) return true;
  const regex = /^\d+(\.\d+)?\s*[xX×\*]\s*\d+(\.\d+)?(\s*(sm|cm|m))?$/i;
  return regex.test(s);
};

export const parseDimensionsFromSize = (
  size: string,
): { widthMm: number; lengthMm: number } => {
  const result = { widthMm: 0, lengthMm: 0 };
  if (!size) return result;

  const normalized = size.toLowerCase().replace(/,/g, '.');
  const matches = normalized.match(/\d+(\.\d+)?/g);
  if (!matches || matches.length < 2) return result;

  const numbers = matches
    .map((val) => Number(val))
    .filter((val) => Number.isFinite(val) && val > 0);
  if (numbers.length < 2) return result;

  const sorted = [...numbers].sort((a, b) => a - b);
  const [rawW, rawL] = sorted;

  const hasCm =
    normalized.includes('cm') ||
    normalized.includes('sm') ||
    normalized.includes('см');
  const hasM = normalized.includes('m') || normalized.includes('м');

  let useCm = false;
  let useM = false;

  if (hasCm) {
    useCm = true;
  } else if (hasM) {
    useM = true;
  } else {
    if (rawW >= 20 || rawL >= 20) {
      useCm = true;
    } else {
      useM = true;
    }
  }

  if (useCm) {
    result.widthMm = Math.round(rawW * 10);
    result.lengthMm = Math.round(rawL * 10);
  } else if (useM) {
    result.widthMm = Math.round(rawW * 1000);
    result.lengthMm = Math.round(rawL * 1000);
  }

  return result;
};
