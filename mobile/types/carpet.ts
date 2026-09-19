export type Category = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  soldCount?: number;
  image?: string | null;
  _count?: {
    carpets: number;
  };
};

export type RollInventory = {
  id: string;
  carpetId: string;
  widthCm: number;
  originalLengthCm: number;
  currentLengthCm: number;
  reservedLengthCm: number;
  pricePerM2: number | string;
};

export type Carpet = {
  id: string;
  slug?: string;
  name: string;
  price: number | string;
  discountPercent?: number;
  size: string;
  material: string;
  description?: string | null;
  designCode?: string | null;
  images: string[];
  categoryId: string;
  category?: Category;
  stock: number;
  likes?: number;
  isLiked?: boolean;
  qo_shimchaKod?: number | null;
  type?: 'READY' | 'ROLL' | 'RETURN_ROLL' | 'RETURN_READY';
  rollInventories?: RollInventory[];
  variants?: Carpet[];
  designCodes?: string[];
  brand?: string | null;
  uniqueCode?: string;
  barcode?: string;
  patternCode?: string | null;
  productType?: 'METRAJ' | 'RUNNER' | 'READY';
  shape?: 'RECTANGLE' | 'OVAL' | 'CIRCLE';
  widthMm?: number;
  lengthMm?: number;
  weightKg?: number | string | null;
  pileHeight?: number | null;
  createdAt: string;
  updatedAt?: string;
};

export type CarpetKind =
  | 'carpet'
  | 'prayer'
  | 'oval'
  | 'roll'
  | 'returned'
  | 'returned_roll'
  | 'returned_ready'
  | 'normal_roll'
  | 'normal_ready'
  | 'normal';

export type CarpetListResponse = {
  items: Carpet[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CarpetQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  material?: string;
  kind?: CarpetKind;
  sortBy?: string;
  showAll?: boolean;
  raw?: boolean;
  collection?: string;
  excludeId?: string;
};
