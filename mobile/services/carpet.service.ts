import { api } from './api';
import type {
  Carpet,
  CarpetListResponse,
  CarpetQuery,
  Category,
} from '@/types/carpet';

export type FilterNamesResponse = {
  success: boolean;
  data: string[];
};

export type FilterMaterialsResponse = {
  success: boolean;
  data: string[];
};

export type FilterSizesResponse = {
  success: boolean;
  data: string[];
};

export async function getCarpets(
  query: CarpetQuery = {},
  signal?: AbortSignal,
): Promise<CarpetListResponse> {
  const { data } = await api.get<CarpetListResponse>('/carpets', {
    params: query,
    signal,
  });
  return {
    ...data,
    items: data?.items ?? [],
  };
}

export async function getCarpetById(
  id: string,
  signal?: AbortSignal,
): Promise<Carpet> {
  const { data } = await api.get<Carpet>(`/carpets/${id}`, { signal });
  return data;
}

export async function getCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories', { signal });
  return data ?? [];
}

export async function getFilterNames(
  kind?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const { data } = await api.get<FilterNamesResponse>('/carpets/filter/names', {
    params: kind ? { kind } : undefined,
    signal,
  });
  return data?.success ? data.data : [];
}

export async function getFilterMaterials(
  kind?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const { data } = await api.get<FilterMaterialsResponse>(
    '/carpets/filter/materials',
    {
      params: kind ? { kind } : undefined,
      signal,
    },
  );
  return data?.success ? data.data : [];
}

export async function getFilterSizes(
  kind?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const { data } = await api.get<FilterSizesResponse>(
    '/carpets/filter/sizes',
    {
      params: kind ? { kind } : undefined,
      signal,
    },
  );
  return data?.success ? data.data : [];
}

/**
 * Syncs user likes with backend when authenticated
 */
export async function toggleCarpetLike(carpetId: string): Promise<{ liked: boolean; likes: number }> {
  const { data } = await api.post<{ liked: boolean; likes: number }>(`/carpets/${carpetId}/like`);
  return data;
}

export async function getLikedCarpets(): Promise<Carpet[]> {
  const { data } = await api.get<Carpet[]>('/carpets/liked');
  return data ?? [];
}
