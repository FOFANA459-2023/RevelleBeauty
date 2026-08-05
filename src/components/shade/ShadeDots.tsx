import type { SwatchDTO } from '@contracts/index';
import { ShadeSwatch } from './ShadeSwatch';

/**
 * The tiny dome row on product cards — the grid's entire color budget.
 * Twelve cards x five beads = a quiet constellation of the real palette.
 */
export function ShadeDots({ swatches, max = 5 }: { swatches: SwatchDTO[]; max?: number }) {
  const withColor = swatches.filter((s) => s.hexColor);
  if (withColor.length === 0) return <div className="h-3" aria-hidden="true" />;
  const shown = withColor.slice(0, max);
  const extra = withColor.length - shown.length;

  return (
    <div className="flex items-center gap-1.5" aria-label={`${withColor.length} shades`}>
      {shown.map((s) => (
        <ShadeSwatch
          key={s.id}
          hex={s.hexColor!}
          hexSecondary={s.hexColorSecondary}
          name={s.name}
          size={12}
          interactive={false}
        />
      ))}
      {extra > 0 && <span className="text-xs text-ink-muted tabular">+{extra}</span>}
    </div>
  );
}
