import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { CSSProperties } from 'react';
import type { ProductSummaryDTO, SwatchDTO } from '@contracts/index';
import { ShadeDots } from '@/components/shade/ShadeDots';
import { formatPriceRange } from '@/lib/money';
import { shadeLabel } from '@/lib/shade';
import { cn } from '@/lib/cn';

/**
 * How long one photograph holds before the card turns to the next. Quick
 * enough to feel like an answer to the pointer rather than a slideshow —
 * the crossfade below is shorter still, so the turn reads as instant without
 * being a cut.
 */
const FRAME_MS = 620;

/**
 * Neutral card: porcelain surface, hairline border, ivory-deep image mat.
 * Hover = motion + a growing gold hairline. Never a hue change.
 *
 * The card turns through photographs under the pointer, one crossfade at a
 * time: resting on the frame walks the product's own set, resting on a shade
 * bead switches to that shade's. Both are mouse enhancements — the card still
 * goes to the product page, where every shade is pickable with a keyboard.
 */
export function ProductCard({ product }: { product: ProductSummaryDTO }) {
  // The reel last pointed at stays mounted after the pointer leaves so its
  // layers can fade back out; `active` is what the card is actually showing.
  const [shade, setShade] = useState<SwatchDTO | null>(null);
  const [active, setActive] = useState(false);
  const [frame, setFrame] = useState(0);
  // The reel is not mounted until a pointer has actually arrived. Rendering it
  // upfront meant a grid of twelve cards fetched sixty photographs on load to
  // show twelve; once mounted it stays, so the fade out still has something to
  // fade and a second hover is instant.
  const [touched, setTouched] = useState(false);

  // A shade bead wins over the frame; otherwise the product's own photographs.
  // Guarded: the Worker can be a deploy ahead of the API, and an older API
  // sends neither list. A card without photographs to turn is fine; a card
  // that throws takes the whole grid down.
  const reel = shade?.imageUrls?.length ? shade.imageUrls : product.previewImageUrls ?? [];
  const showing = active && reel.length > 0;
  // Which reel is loaded — swapping between the frame's and a shade's restarts it.
  const reelKey = reel[0] ?? '';

  const previewShade = (swatch: SwatchDTO | null) => {
    if (swatch?.imageUrls?.length) setShade(swatch);
    else setShade(null);
    if (swatch) setTouched(true);
    setActive(Boolean(swatch));
  };

  // Every photograph of the reel is mounted at once and crossfaded by
  // opacity — the browser has them decoded before their turn comes, so a
  // turn never flashes the mat underneath.
  useEffect(() => {
    setFrame(0);
    if (!showing || reel.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % reel.length), FRAME_MS);
    return () => clearInterval(id);
  }, [showing, reel.length, reelKey]);

  return (
    <Link
      to={
        active && shade
          ? `/product/${product.slug}?shade=${shade.slug}`
          : `/product/${product.slug}`
      }
      className="group block bg-porcelain rounded-xs border border-hairline overflow-hidden"
    >
      <div
        className="relative aspect-[4/5] bg-ivory-deep overflow-hidden"
        onMouseEnter={() => { setTouched(true); setActive(true); }}
        onMouseLeave={() => setActive(false)}
      >
        {product.primaryImage ? (
          <img
            src={product.primaryImage.thumbUrl}
            alt={product.primaryImage.altText ?? product.name}
            width={product.primaryImage.width ?? undefined}
            height={product.primaryImage.height ?? undefined}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.03]"
            style={{ transitionTimingFunction: 'var(--ease-couture)' }}
          />
        ) : (
          <ProductPlaceholder swatchHex={product.swatches[0]?.hexColor ?? null} />
        )}

        {/* The reel dissolves over the primary, and back off it on the way out. */}
        {touched && reel.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            aria-hidden="true"
            decoding="async"
            className={cn(
              'absolute inset-0 h-full w-full object-contain',
              'transition-opacity duration-[260ms] scale-[1.03]',
              showing && i === frame ? 'opacity-100' : 'opacity-0',
            )}
            style={{ transitionTimingFunction: 'var(--ease-couture)' }}
          />
        ))}

        {!product.inStock && (
          <span className="absolute top-3 left-3 eyebrow text-[0.56rem] bg-porcelain/90 text-ink px-2.5 py-1.5 rounded-xs border border-hairline">
            Sold out
          </span>
        )}

        {/* How many photographs are in the reel, and which one is showing. */}
        {showing && reel.length > 1 && (
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1.5 animate-[fadein_400ms_var(--ease-couture)_both]"
            aria-hidden="true"
          >
            {reel.map((url, i) => (
              <span
                key={url}
                className={cn(
                  'h-px w-4 transition-colors duration-500',
                  i === frame ? 'bg-gold-700' : 'bg-ink-muted/35',
                )}
              />
            ))}
          </span>
        )}

        {/* gold hairline grows from center on hover */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px bg-gold-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center"
          style={{ transitionTimingFunction: 'var(--ease-couture)' }}
        />
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="font-display text-lg leading-snug text-ink group-hover:text-ink-soft transition-colors">
          {product.name}
        </h3>
        {/* The shade's name takes the tagline's line while it is being pointed at. */}
        <p className="mt-1 text-xs text-ink-muted line-clamp-1 min-h-4">
          {active && shade ? (
            <span className="shade-name text-ink-soft">{shadeLabel(shade)}</span>
          ) : (
            product.tagline
          )}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <ShadeDots swatches={product.swatches} onPreview={previewShade} />
          <span className="text-sm text-ink-soft tabular">
            {formatPriceRange(product.priceCents, product.priceMaxCents)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Elegant no-photo placeholder: a big gloss dome on the ivory mat. */
function ProductPlaceholder({ swatchHex }: { swatchHex: string | null }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      {swatchHex ? (
        <span
          className="shade-swatch"
          style={{ '--shade': swatchHex, inlineSize: 88, blockSize: 88 } as CSSProperties}
          aria-hidden="true"
        />
      ) : (
        <span className="font-display text-4xl text-gold-300 select-none" aria-hidden="true">
          RB
        </span>
      )}
    </div>
  );
}
