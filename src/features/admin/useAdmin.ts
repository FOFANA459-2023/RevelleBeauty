import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/http';

// Admin sign-in/out lives in features/auth/useCustomer — one login for all
// roles. These hooks only fetch admin data; the API 403s non-admin sessions.

export function useAdminProducts(filters: { status?: string; q?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.products(filters),
    queryFn: () => api.adminListProducts(filters),
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.product(id ?? ''),
    queryFn: () => api.adminGetProduct(id!),
    enabled: Boolean(id),
  });
}

export function useAdminOrders(filters: { status?: string; q?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.orders(filters),
    queryFn: () => api.adminListOrders(filters),
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.order(id ?? ''),
    queryFn: () => api.adminGetOrder(id!),
    enabled: Boolean(id),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: api.adminStats,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.admin.categories(),
    queryFn: api.adminListCategories,
  });
}

export { ApiError };
