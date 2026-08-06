import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfilePatch, RegisterBody } from '@contracts/index';
import * as api from '@/lib/api';
import { ApiError } from '@/lib/http';

const KEY = {
  me: ['customer', 'me'] as const,
  orders: ['customer', 'orders'] as const,
  order: (id: string) => ['customer', 'order', id] as const,
};

export function useCustomer() {
  return useQuery({
    queryKey: KEY.me,
    queryFn: api.customerMe,
    retry: (count, err) => !(err instanceof ApiError && err.status === 401) && count < 1,
    staleTime: 5 * 60_000,
  });
}

export function useCustomerLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.customerLogin(email, password),
    onSuccess: (customer) => qc.setQueryData(KEY.me, customer),
  });
}

export function useCustomerRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterBody) => api.customerRegister(body),
    onSuccess: (customer) => qc.setQueryData(KEY.me, customer),
  });
}

export function useCustomerLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.customerLogout,
    onSuccess: () => {
      qc.setQueryData(KEY.me, null);
      qc.removeQueries({ queryKey: ['customer'] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => api.customerUpdateProfile(patch),
    onSuccess: (customer) => qc.setQueryData(KEY.me, customer),
  });
}

export function useAccountOrders() {
  return useQuery({ queryKey: KEY.orders, queryFn: api.accountOrders });
}

export function useAccountOrder(id: string | undefined) {
  return useQuery({
    queryKey: KEY.order(id ?? ''),
    queryFn: () => api.accountOrder(id!),
    enabled: Boolean(id),
    // Tracking page: refresh periodically so admin updates appear live.
    refetchInterval: 30_000,
  });
}

export function useConfirmDelivery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.confirmDelivery(orderId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer'] }),
  });
}
