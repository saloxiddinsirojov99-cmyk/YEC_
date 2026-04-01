export type Category = {
  id: string;
  name: string;
};

export type Carpet = {
  id: string;
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
  createdAt: string;
};

export type CarpetKind = 'carpet' | 'prayer' | 'oval';

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
};
