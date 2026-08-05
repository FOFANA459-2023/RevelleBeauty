import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'metal' | 'solid' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

/**
 * metal   — the single primary CTA in view (ink on gold, never white on gold)
 * solid   — ink fill / white text; the admin default
 * outline — transparent with metallic hairline border
 * ghost   — text-only ink
 */
export function Button({
  variant = 'solid',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  const sizes: Record<Size, string> = {
    sm: 'px-4 py-2 text-[0.625rem]',
    md: 'px-7 py-3.5 text-eyebrow',
    lg: 'px-10 py-4 text-eyebrow',
  };
  const variants: Record<Variant, string> = {
    metal: 'metal-surface metal-sheen text-ink',
    solid: 'bg-ink text-porcelain hover:bg-ink-soft',
    outline: 'metal-border text-ink hover:bg-ivory',
    ghost: 'text-ink hover:bg-ivory-deep',
  };

  return (
    <button
      className={cn(
        'eyebrow inline-flex items-center justify-center gap-2 rounded-xs',
        'transition-colors duration-300 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span aria-hidden="true">···</span> : children}
    </button>
  );
}
