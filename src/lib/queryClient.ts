import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) =>
        !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});

export const queryKeys = {
  products: (f?: Record<string, unknown>) => ['products', f ?? {}] as const,
  product: (slug: string) => ['product', slug] as const,
  related: (slug: string) => ['related', slug] as const,
  categories: () => ['categories'] as const,
  settings: () => ['settings'] as const,
  confirmation: (sessionId: string) => ['confirmation', sessionId] as const,
  admin: {
    session: () => ['admin', 'session'] as const,
    stats: () => ['admin', 'stats'] as const,
    products: (f?: Record<string, unknown>) => ['admin', 'products', f ?? {}] as const,
    product: (id: string) => ['admin', 'product', id] as const,
    orders: (f?: Record<string, unknown>) => ['admin', 'orders', f ?? {}] as const,
    order: (id: string) => ['admin', 'order', id] as const,
    categories: () => ['admin', 'categories'] as const,
  },
};
