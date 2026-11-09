import { useId } from 'react';
import { cn } from '@/lib/cn';

const STAR =
  'M12 2.5l2.83 6.06 6.62.78-4.9 4.52 1.3 6.54L12 17.1l-5.85 3.3 1.3-6.54-4.9-4.52 6.62-.78z';

/** One star, outlined or filled, for inputs that need them individually. */
export function StarIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="text-gold-700">
      <path
        d={STAR}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A row of five stars filled to `value` (fractions allowed), in gold.
 * Decorative by default: pass `label` when the stars are the only place the
 * rating is stated.
 */
export function Stars({
  value,
  size = 14,
  label,
  className,
}: {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <span
      className={cn('inline-flex items-center gap-[2px] text-gold-700', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        const clip = `${id}-${i}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id={clip}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            <path d={STAR} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            {fill > 0 && <path d={STAR} fill="currentColor" clipPath={`url(#${clip})`} />}
          </svg>
        );
      })}
    </span>
  );
}

/** "4.8 · 23 reviews" with stars, or nothing until there is a first review. */
export function RatingLine({
  rating,
  size = 13,
  className,
  compact = false,
}: {
  rating: { average: number; count: number } | null;
  size?: number;
  className?: string;
  compact?: boolean;
}) {
  if (!rating) return null;
  const label = `Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} review${rating.count === 1 ? '' : 's'}`;
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs text-ink-muted tabular', className)}>
      <Stars value={rating.average} size={size} label={label} />
      <span aria-hidden="true">
        {compact ? `(${rating.count})` : `${rating.average.toFixed(1)} · ${rating.count} review${rating.count === 1 ? '' : 's'}`}
      </span>
    </span>
  );
}
