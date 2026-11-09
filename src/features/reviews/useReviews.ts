import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReviewInput } from '@contracts/index';
import * as api from '@/lib/api';
import type { ReviewSort } from '@/lib/api';
import { ApiError } from '@/lib/http';
import { queryKeys } from '@/lib/queryClient';

const PAGE = 6;

export const reviewKeys = {
  all: ['reviews'] as const,
  product: (slug: string, sort: ReviewSort) => ['reviews', 'product', slug, sort] as const,
  mine: (slug: string) => ['reviews', 'mine', slug] as const,
  recent: () => ['reviews', 'recent'] as const,
  admin: (status?: string) => ['admin', 'reviews', status ?? 'all'] as const,
};

export function useProductReviews(slug: string, sort: ReviewSort) {
  return useInfiniteQuery({
    queryKey: reviewKeys.product(slug, sort),
    queryFn: ({ pageParam }) => api.getProductReviews(slug, { limit: PAGE, offset: pageParam, sort }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.reviews.length, 0);
      return loaded < last.total ? loaded : undefined;
    },
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}

/** The signed-in shopper's own review; null when signed out or not written yet. */
export function useMyReview(slug: string, signedIn: boolean) {
  return useQuery({
    queryKey: reviewKeys.mine(slug),
    queryFn: () => api.getMyReview(slug),
    enabled: Boolean(slug) && signedIn,
    retry: (count, err) => !(err instanceof ApiError && err.status === 401) && count < 1,
  });
}

export function useRecentReviews(limit = 3) {
  return useQuery({
    queryKey: reviewKeys.recent(),
    queryFn: () => api.getRecentReviews(limit),
    staleTime: 60_000,
  });
}

/** After any write, every list, average and card rating is out of date. */
function useInvalidateAfterWrite(slug: string) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: reviewKeys.all });
    void qc.invalidateQueries({ queryKey: queryKeys.product(slug) });
    void qc.invalidateQueries({ queryKey: ['products'] });
  };
}

export function useSaveReview(slug: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateAfterWrite(slug);
  return useMutation({
    mutationFn: (input: ReviewInput) => api.putMyReview(slug, input),
    onSuccess: (review) => {
      qc.setQueryData(reviewKeys.mine(slug), review);
      invalidate();
    },
  });
}

export function useDeleteReview(slug: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateAfterWrite(slug);
  return useMutation({
    mutationFn: () => api.deleteMyReview(slug),
    onSuccess: () => {
      qc.setQueryData(reviewKeys.mine(slug), null);
      invalidate();
    },
  });
}

/* ---------- admin ---------- */

export function useAdminReviews(status?: 'published' | 'hidden') {
  return useQuery({
    queryKey: reviewKeys.admin(status),
    queryFn: () => api.adminListReviews({ status }),
  });
}

export function useAdminModerateReview() {
  const qc = useQueryClient();
  const done = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    void qc.invalidateQueries({ queryKey: reviewKeys.all });
    void qc.invalidateQueries({ queryKey: ['products'] });
    void qc.invalidateQueries({ queryKey: ['product'] });
  };
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'published' | 'hidden' }) =>
      api.adminSetReviewStatus(id, status),
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.adminDeleteReview(id),
    onSuccess: done,
  });
  return { setStatus, remove };
}
