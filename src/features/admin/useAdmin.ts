import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/http';

export function useAdminSession() {
  return useQuery({
    queryKey: queryKeys.admin.session(),
    queryFn: api.adminMe,
    retry: false,
    staleTime: 60_000,
  });
}

export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api.adminLogin(password),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.session() }),
  });
}

export function useAdminLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.adminLogout,
    onSuccess: () => qc.clear(),
  });
}

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
