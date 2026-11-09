import { useState } from 'react';
import { Link } from 'react-router';
import { useAdminModerateReview, useAdminReviews } from '@/features/reviews/useReviews';
import { Stars } from '@/components/review/Stars';
import { cn } from '@/lib/cn';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Moderation. Reviews publish the moment a customer posts them; this is where
 * one that breaks the rules (spam, abuse, personal details) is hidden or
 * deleted. Hiding is reversible and keeps the customer's text; deleting is not.
 */
export function AdminReviewsPage() {
  const [status, setStatus] = useState<'' | 'published' | 'hidden'>('');
  const { data, isPending } = useAdminReviews(status || undefined);
  const { setStatus: moderate, remove } = useAdminModerateReview();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Reviews</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="bg-porcelain border border-hairline rounded-md px-3 py-2 text-[14px]"
          aria-label="Filter by status"
        >
          <option value="">All reviews</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {isPending ? (
        <p className="text-[14px] text-ink-muted">Loading…</p>
      ) : !data || data.reviews.length === 0 ? (
        <p className="text-[14px] text-ink-muted bg-porcelain border border-hairline rounded-md p-6">
          No reviews yet. They appear here as customers post them on product pages.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.reviews.map((r) => (
            <li
              key={r.id}
              className={cn(
                'bg-porcelain border border-hairline rounded-md p-4',
                r.status === 'hidden' && 'opacity-70',
              )}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                <Stars value={r.rating} size={13} label={`${r.rating} out of 5`} />
                <Link to={`/product/${r.product.slug}#reviews`} className="font-medium text-ink hover:underline">
                  {r.product.name}
                </Link>
                <span className="text-ink-muted">{r.author} · {r.customerEmail}</span>
                {r.verifiedPurchase && <span className="text-gold-950">Verified purchase</span>}
                <span className="text-ink-muted">{DATE.format(new Date(r.createdAt))}</span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded border text-[11px] uppercase tracking-wide',
                    r.status === 'published' ? 'border-gold-500 text-ink' : 'border-hairline text-ink-muted',
                  )}
                >
                  {r.status}
                </span>
              </div>
              {r.title && <p className="mt-2 text-[14px] font-medium text-ink">{r.title}</p>}
              <p className="mt-1 text-[14px] text-ink-soft whitespace-pre-line break-words">{r.body}</p>
              <div className="mt-3 flex gap-4 text-[13px]">
                <button
                  type="button"
                  className="text-ink underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  disabled={moderate.isPending}
                  onClick={() =>
                    moderate.mutate({ id: r.id, status: r.status === 'published' ? 'hidden' : 'published' })
                  }
                >
                  {r.status === 'published' ? 'Hide' : 'Publish again'}
                </button>
                <button
                  type="button"
                  className="text-ink-muted underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm('Delete this review permanently? This cannot be undone.')) remove.mutate(r.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
