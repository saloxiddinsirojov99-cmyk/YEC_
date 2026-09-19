import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getCategories,
  getCarpets,
  getCarpetById,
  getFilterNames,
  getFilterMaterials,
  getFilterSizes,
} from '@/services/carpet.service';
import type { CarpetQuery, CarpetListResponse } from '@/types/carpet';

export const CATALOG_QUERY_KEYS = {
  allCategories: ['categories'] as const,
  carpets: (query: CarpetQuery) => ['carpets', query] as const,
  infiniteCarpets: (query: CarpetQuery) => ['infinite-carpets', query] as const,
  carpetDetails: (id: string) => ['carpet', id] as const,
  filterNames: (kind?: string) => ['filter-names', kind] as const,
  filterMaterials: (kind?: string) => ['filter-materials', kind] as const,
  filterSizes: (kind?: string) => ['filter-sizes', kind] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.allCategories,
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCarpets(query: CarpetQuery = {}) {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.carpets(query),
    queryFn: ({ signal }) => getCarpets(query, signal),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Infinite pagination hook for large catalogs (such as the 4,488 carpets).
 * Automatically concatenates pages without duplicates or memory leaks.
 */
export function useInfiniteCarpets(baseQuery: CarpetQuery = {}, pageSize = 20) {
  return useInfiniteQuery<CarpetListResponse>({
    queryKey: CATALOG_QUERY_KEYS.infiniteCarpets({ ...baseQuery, limit: pageSize }),
    queryFn: ({ pageParam = 1, signal }) =>
      getCarpets(
        {
          ...baseQuery,
          page: Number(pageParam),
          limit: pageSize,
        },
        signal,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCarpetDetails(id: string) {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.carpetDetails(id),
    queryFn: ({ signal }) => getCarpetById(id, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFilterOptions(kind?: string) {
  const namesQuery = useQuery({
    queryKey: CATALOG_QUERY_KEYS.filterNames(kind),
    queryFn: ({ signal }) => getFilterNames(kind, signal),
    staleTime: 10 * 60 * 1000,
  });

  const materialsQuery = useQuery({
    queryKey: CATALOG_QUERY_KEYS.filterMaterials(kind),
    queryFn: ({ signal }) => getFilterMaterials(kind, signal),
    staleTime: 10 * 60 * 1000,
  });

  const sizesQuery = useQuery({
    queryKey: CATALOG_QUERY_KEYS.filterSizes(kind),
    queryFn: ({ signal }) => getFilterSizes(kind, signal),
    staleTime: 10 * 60 * 1000,
  });

  return {
    names: namesQuery.data ?? [],
    materials: materialsQuery.data ?? [],
    sizes: sizesQuery.data ?? [],
    isLoading:
      namesQuery.isLoading || materialsQuery.isLoading || sizesQuery.isLoading,
    isError:
      namesQuery.isError || materialsQuery.isError || sizesQuery.isError,
    refetchAll: () => {
      namesQuery.refetch();
      materialsQuery.refetch();
      sizesQuery.refetch();
    },
  };
}

/**
 * Standard debounce hook for search queries to prevent flooding the backend.
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
