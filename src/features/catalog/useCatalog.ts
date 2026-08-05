import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as api from '@/lib/api';
import type { ProductListQuery } from '@contracts/index';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: api.getCategories,
    staleTime: 5 * 60_000,
  });
}

export function useProducts(q: ProductListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.products(q as Record<string, unknown>),
    queryFn: () => api.getProducts(q),
    staleTime: 5 * 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => api.getProduct(slug),
    staleTime: 5 * 60_000,
    enabled: Boolean(slug),
  });
}

export function useRelatedProducts(slug: string) {
  return useQuery({
    queryKey: queryKeys.related(slug),
    queryFn: () => api.getRelatedProducts(slug),
    staleTime: 5 * 60_000,
    enabled: Boolean(slug),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: api.getSettings,
    staleTime: 10 * 60_000,
  });
}
