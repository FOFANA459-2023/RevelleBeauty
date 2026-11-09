import { useState } from 'react';
import { Link } from 'react-router';
import type { MyReviewDTO, ReviewDTO } from '@contracts/index';
import type { ReviewSort } from '@/lib/api';
import { ApiError } from '@/lib/http';
import { useCustomer } from '@/features/auth/useCustomer';
import {
  useDeleteReview,
  useMyReview,
  useProductReviews,
  useSaveReview,
} from '@/features/reviews/useReviews';
import { Button } from '@/components/ui/Button';
import { Sparkle } from '@/components/brand/Sparkle';
import { StarIcon, Stars } from './Stars';

const DATE = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const BODY_MIN = 10;
const BODY_MAX = 2000;
const TITLE_MAX = 120;

/**
 * Reviews on the product page: the average and its spread, the reviews
 * themselves, and the shopper's own review. Everything here was written by a
 * signed-in customer; until someone writes one, the section says so plainly.
 */
export function ProductReviews({ slug, productName }: { slug: string; productName: string }) {
  const [sort, setSort] = useState<ReviewSort>('newest');
  const reviews = useProductReviews(slug, sort);
  const { data: customer } = useCustomer();
  const signedIn = Boolean(customer);
  const mine = useMyReview(slug, signedIn);
  const [writing, setWriting] = useState(false);

  const first = reviews.data?.pages[0];
  const summary = first?.summary ?? null;
  const list = reviews.data?.pages.flatMap((p) => p.reviews) ?? [];

  return (
    <section id="reviews" className="mt-section scroll-mt-28" aria-labelledby="reviews-heading">
      <div className="text-center mb-10">
        <p className="eyebrow text-gold-950">From customers</p>
        <h2 id="reviews-heading" className="display text-h1 text-ink mt-4">Reviews</h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
        {/* ----- summary + write ----- */}
        <div className="lg:col-span-4">
          {summary ? (
            <div className="border border-hairline rounded-sm bg-porcelain p-6">
              <div className="flex items-end gap-4">
                <span className="font-display text-6xl leading-none text-ink tabular">{summary.average.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars value={summary.average} size={16} label={`Rated ${summary.average.toFixed(1)} out of 5`} />
                  <p className="text-xs text-ink-muted mt-1">
                    {summary.count} review{summary.count === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-2" aria-label="Ratings breakdown">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = summary.distribution[star - 1];
                  const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
                  return (
                    <li key={star} className="flex items-center gap-3 text-xs text-ink-muted tabular">
                      <span className="w-12 shrink-0">{star} star{star === 1 ? '' : 's'}</span>
                      <span className="h-1.5 flex-1 rounded-full bg-ivory-deep overflow-hidden" aria-hidden="true">
                        <span className="block h-full bg-gold-500 rounded-full" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 text-right">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            !reviews.isPending && (
              <div className="border border-hairline rounded-sm bg-porcelain p-6 text-center">
                <Sparkle size={18} className="text-gold-500" />
                <p className="mt-4 font-display text-h3 text-ink">No reviews yet</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Tried {productName}? Be the first to say how it wears.
                </p>
              </div>
            )
          )}

          <div className="mt-6">
            <MyReviewPanel
              slug={slug}
              signedIn={signedIn}
              mine={mine.data ?? null}
              loadingMine={signedIn && mine.isPending}
              writing={writing}
              setWriting={setWriting}
            />
          </div>
        </div>

        {/* ----- the reviews ----- */}
        <div className="lg:col-span-8 min-w-0">
          {list.length > 0 && (
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-hairline">
              <p className="text-sm text-ink-muted">
                Showing {list.length} of {first?.total ?? list.length}
              </p>
              <label className="flex items-center gap-2 text-sm text-ink-muted">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as ReviewSort)}
                  className="bg-porcelain border border-hairline rounded-xs px-2 py-1.5 text-sm text-ink"
                >
                  <option value="newest">Newest</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
              </label>
            </div>
          )}

          <ul>
            {list.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </ul>

          {reviews.hasNextPage && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => void reviews.fetchNextPage()}
                loading={reviews.isFetchingNextPage}
              >
                Show more reviews
              </Button>
            </div>
          )}
          {reviews.isError && (
            <p className="text-sm text-ink-muted">Reviews could not be loaded just now.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function ReviewItem({ review, showProduct = false }: { review: ReviewDTO; showProduct?: boolean }) {
  return (
    <li className="py-6 border-b border-hairline">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} size={14} label={`${review.rating} out of 5 stars`} />
        {review.title && <p className="font-display text-lg text-ink">{review.title}</p>}
      </div>
      <p className="mt-3 text-sm text-ink-soft leading-relaxed whitespace-pre-line break-words">{review.body}</p>
      <p className="mt-4 text-xs text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="eyebrow text-ink">{review.author}</span>
        {review.verifiedPurchase && (
          <span className="inline-flex items-center gap-1 text-gold-950">
            <Sparkle size={9} className="text-gold-500" /> Verified purchase
          </span>
        )}
        <span>{DATE.format(new Date(review.createdAt))}</span>
        {showProduct && review.product && (
          <Link to={`/product/${review.product.slug}`} className="link-ink text-ink">
            {review.product.name}
          </Link>
        )}
      </p>
    </li>
  );
}

function MyReviewPanel({
  slug,
  signedIn,
  mine,
  loadingMine,
  writing,
  setWriting,
}: {
  slug: string;
  signedIn: boolean;
  mine: MyReviewDTO | null;
  loadingMine: boolean;
  writing: boolean;
  setWriting: (v: boolean) => void;
}) {
  const remove = useDeleteReview(slug);

  if (!signedIn) {
    return (
      <p className="text-sm text-ink-soft text-center lg:text-left">
        <Link to={`/login?next=${encodeURIComponent(`/product/${slug}#reviews`)}`} className="link-ink text-ink">
          Sign in
        </Link>{' '}
        to write a review.
      </p>
    );
  }
  if (loadingMine) return null;

  if (writing) {
    return <ReviewForm slug={slug} initial={mine} onDone={() => setWriting(false)} />;
  }

  if (mine) {
    return (
      <div className="border border-hairline rounded-sm p-5">
        <p className="eyebrow text-ink">Your review</p>
        <Stars value={mine.rating} size={14} className="mt-3" label={`You rated it ${mine.rating} out of 5`} />
        {mine.status === 'hidden' && (
          <p className="mt-3 text-xs text-ink-muted">
            This review has been hidden by our team and is not shown publicly.
          </p>
        )}
        <div className="mt-4 flex gap-4">
          <button type="button" className="text-sm link-ink text-ink cursor-pointer" onClick={() => setWriting(true)}>
            Edit
          </button>
          <button
            type="button"
            className="text-sm link-ink text-ink-muted cursor-pointer"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm('Delete your review?')) remove.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="metal" className="w-full" onClick={() => setWriting(true)}>
      Write a review
    </Button>
  );
}

function ReviewForm({
  slug,
  initial,
  onDone,
}: {
  slug: string;
  initial: MyReviewDTO | null;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [touched, setTouched] = useState(false);
  const save = useSaveReview(slug);

  const bodyLength = body.trim().length;
  const problems = [
    rating < 1 && 'Choose a star rating.',
    bodyLength < BODY_MIN && `Write at least ${BODY_MIN} characters.`,
  ].filter(Boolean) as string[];

  const serverError =
    save.error instanceof ApiError
      ? save.error.status === 429
        ? 'You have posted a lot of reviews recently. Please try again later.'
        : save.error.message
      : save.error
        ? 'Your review could not be saved. Please try again.'
        : null;

  return (
    <form
      className="border border-hairline rounded-sm p-5 space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (problems.length) return;
        save.mutate(
          { rating, title: title.trim() || null, body: body.trim() },
          { onSuccess: onDone },
        );
      }}
    >
      <fieldset>
        <legend className="eyebrow text-ink">Your rating</legend>
        <StarInput value={rating} onChange={setRating} />
      </fieldset>

      <label className="block">
        <span className="eyebrow text-ink-muted">Title (optional)</span>
        <input
          type="text"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full metal-border rounded-xs px-3 py-2.5 text-sm text-ink bg-porcelain"
        />
      </label>

      <label className="block">
        <span className="eyebrow text-ink-muted">Your review</span>
        <textarea
          value={body}
          maxLength={BODY_MAX}
          rows={5}
          required
          onChange={(e) => setBody(e.target.value)}
          placeholder="How does it feel, how long does it last, how is the color?"
          className="mt-2 w-full metal-border rounded-xs px-3 py-2.5 text-sm text-ink bg-porcelain resize-y"
        />
        <span className="mt-1 block text-right text-xs text-ink-muted tabular">
          {body.length}/{BODY_MAX}
        </span>
      </label>

      {touched && problems.length > 0 && (
        <ul className="text-sm text-ink space-y-1" role="alert">
          {problems.map((p) => <li key={p}>{p}</li>)}
        </ul>
      )}
      {serverError && <p className="text-sm text-ink" role="alert">{serverError}</p>}

      <div className="flex items-center gap-4">
        <Button variant="metal" type="submit" loading={save.isPending}>
          {initial ? 'Update review' : 'Post review'}
        </Button>
        <button type="button" className="text-sm link-ink text-ink-muted cursor-pointer" onClick={onDone}>
          Cancel
        </button>
      </div>
      <p className="text-xs text-ink-muted">
        Shown with your first name and last initial. Reviews from customers who bought the product are marked verified.
      </p>
    </form>
  );
}

/** Five radio buttons drawn as stars: arrow keys and clicks both work. */
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className="cursor-pointer p-0.5 rounded-xs has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold-500"
          onMouseEnter={() => setHover(n)}
        >
          <input
            type="radio"
            name="rating"
            value={n}
            checked={value === n}
            onChange={() => onChange(n)}
            className="sr-only"
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
          />
          <StarIcon filled={shown >= n} size={26} />
        </label>
      ))}
    </div>
  );
}
