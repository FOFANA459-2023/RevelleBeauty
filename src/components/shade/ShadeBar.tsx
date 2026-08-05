/**
 * The 6px full-column-width gradient field of the selected shade — the only
 * large saturated area on the site. It is literally the product.
 */
export function ShadeBar({ hex, hexSecondary }: { hex: string; hexSecondary?: string | null }) {
  const end = hexSecondary ?? hex;
  return (
    <div
      aria-hidden="true"
      className="mt-6 h-[6px] w-full rounded-full transition-all duration-500"
      style={{
        background: `linear-gradient(90deg,
          color-mix(in oklab, ${hex} 78%, white),
          ${hex} 40%,
          color-mix(in oklab, ${end} 85%, black))`,
        transitionTimingFunction: 'var(--ease-couture)',
      }}
    />
  );
}
