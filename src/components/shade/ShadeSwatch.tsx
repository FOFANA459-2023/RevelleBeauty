import type { ButtonHTMLAttributes, CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * The gloss dome — the only chromatic primitive on the site.
 * Runtime hex enters ONLY via CSS variables (Tailwind v4 cannot generate
 * utilities from runtime values). The .shade-swatch recipe lives in metal.css.
 */
export interface ShadeSwatchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hex: string;
  hexSecondary?: string | null;
  name: string;
  size?: number;
  selected?: boolean;
  soldOut?: boolean;
  interactive?: boolean;
}

export function ShadeSwatch({
  hex,
  hexSecondary,
  name,
  size = 44,
  selected = false,
  soldOut = false,
  interactive = true,
  className,
  style,
  ...rest
}: ShadeSwatchProps) {
  const vars = {
    '--shade': hex,
    ...(hexSecondary ? { '--shade-2': hexSecondary } : {}),
    inlineSize: size,
    blockSize: size,
    ...style,
  } as CSSProperties;

  if (!interactive) {
    return (
      <span
        className={cn('shade-swatch', className)}
        style={vars}
        data-duo={hexSecondary ? '' : undefined}
        data-selected={selected ? 'true' : undefined}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={soldOut || undefined}
      aria-label={soldOut ? `${name}, sold out` : name}
      title={name}
      className={cn('shade-swatch', className)}
      style={vars}
      data-duo={hexSecondary ? '' : undefined}
      {...rest}
    />
  );
}
