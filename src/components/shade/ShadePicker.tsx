import { useCallback, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { VariantDTO } from '@contracts/index';
import { ShadeSwatch } from './ShadeSwatch';
import { ShadeBar } from './ShadeBar';
import { shadeLabel } from '@/lib/shade';

/**
 * The visual hero of the product page. radiogroup + roving tabindex,
 * arrow keys move+select, Home/End jump. Selection mirrors to ?shade= via
 * the parent (deep-linkable, back-button-correct).
 */
export function ShadePicker({
  label,
  variants,
  value,
  onChange,
}: {
  label: string;
  variants: VariantDTO[];
  value: VariantDTO | null;
  onChange: (v: VariantDTO) => void;
}) {
  const shades = variants.filter((v) => v.hexColor);
  const groupRef = useRef<HTMLDivElement>(null);
  // Pointing at a dome names it; the selection itself does not move until
  // the shopper clicks. Keyboard focus previews too, so both paths read alike.
  const [hovered, setHovered] = useState<VariantDTO | null>(null);
  const shown = hovered ?? value;

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!value || shades.length === 0) return;
      const idx = shades.findIndex((s) => s.id === value.id);
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % shades.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + shades.length) % shades.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = shades.length - 1;
      if (next >= 0) {
        e.preventDefault();
        const target = shades[next]!;
        onChange(target);
        const btn = groupRef.current?.querySelectorAll<HTMLButtonElement>('.shade-swatch')[next];
        btn?.focus();
      }
    },
    [shades, value, onChange],
  );

  if (shades.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="eyebrow text-ink-muted">{label}</span>
        {shown && (
          <span className="flex items-baseline gap-2" aria-live="polite">
            {shown.shadeCode && (
              <span className="eyebrow tabular text-ink-muted">{shown.shadeCode}</span>
            )}
            <span
              key={shown.id}
              className="shade-name text-h3 text-ink animate-[fadein_260ms_var(--ease-couture)_both]"
            >
              {shown.name}
            </span>
          </span>
        )}
      </div>

      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={label}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHovered(null)}
        onBlur={() => setHovered(null)}
        className="mt-5 grid grid-cols-6 gap-3 sm:grid-cols-7"
      >
        {shades.map((s) => (
          <ShadeSwatch
            key={s.id}
            hex={s.hexColor!}
            hexSecondary={s.hexColorSecondary}
            name={shadeLabel(s)}
            selected={value?.id === s.id}
            soldOut={!s.inStock}
            tabIndex={value?.id === s.id ? 0 : -1}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHovered(s)}
            onFocus={() => setHovered(s)}
          />
        ))}
      </div>

      {shown?.hexColor && <ShadeBar hex={shown.hexColor} hexSecondary={shown.hexColorSecondary} />}
    </div>
  );
}
