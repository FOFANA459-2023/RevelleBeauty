import type { SwatchDTO } from '@contracts/index';
import { ShadeSwatch } from './ShadeSwatch';
import { shadeLabel } from '@/lib/shade';

/**
 * The tiny dome row on product cards — the grid's entire color budget.
 * Twelve cards x five beads = a quiet constellation of the real palette.
 *
 * With `onPreview` the beads answer the pointer: the card swaps to that
 * shade's photograph while the mouse rests on it. They stay non-interactive
 * elements — the row lives inside the card's link, and a button inside an
 * anchor is invalid; the keyboard path is the product page itself.
 */
export function ShadeDots({
  swatches,
  max = 5,
  onPreview,
}: {
  swatches: SwatchDTO[];
  max?: number;
  onPreview?: (swatch: SwatchDTO | null) => void;
}) {
  const withColor = swatches.filter((s) => s.hexColor);
  if (withColor.length === 0) return <div className="h-3" aria-hidden="true" />;
  const shown = withColor.slice(0, max);
  const extra = withColor.length - shown.length;

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${withColor.length} shades`}
      onMouseLeave={onPreview ? () => onPreview(null) : undefined}
    >
      {shown.map((s) => (
        <span
          key={s.id}
          onMouseEnter={onPreview ? () => onPreview(s) : undefined}
          className="inline-flex p-0.5 -m-0.5"
        >
          <ShadeSwatch
            hex={s.hexColor!}
            hexSecondary={s.hexColorSecondary}
            name={shadeLabel(s)}
            size={12}
            interactive={false}
            className="transition-transform duration-300 hover:scale-150"
          />
        </span>
      ))}
      {extra > 0 && <span className="text-xs text-ink-muted tabular">+{extra}</span>}
    </div>
  );
}
