import { useQuery } from '@tanstack/react-query';
import { getCategories, getCarpets, getCarpetById } from '@/services/carpet.service';
import type { CarpetQuery } from '@/types/carpet';

export const CATALOG_QUERY_KEYS = {
  allCategories: ['categories'] as const,
  carpets: (query: CarpetQuery) => ['carpets', query] as const,
  carpetDetails: (id: string) => ['carpet', id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.allCategories,
    queryFn: ({ signal }) => getCategories(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCarpets(query: CarpetQuery = {}) {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.carpets(query),
    queryFn: ({ signal }) => getCarpets(query, signal),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCarpetDetails(id: string) {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.carpetDetails(id),
    queryFn: ({ signal }) => getCarpetById(id, signal),
    enabled: Boolean(id),
  });
}
