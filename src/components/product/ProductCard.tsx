import { Link } from 'react-router';
import type { CSSProperties } from 'react';
import type { ProductSummaryDTO } from '@contracts/index';
import { ShadeDots } from '@/components/shade/ShadeDots';
import { formatPriceRange } from '@/lib/money';

/**
 * Neutral card: porcelain surface, hairline border, ivory-deep image mat.
 * Hover = motion + a growing gold hairline. Never a hue change.
 */
export function ProductCard({ product }: { product: ProductSummaryDTO }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block bg-porcelain rounded-xs border border-hairline overflow-hidden"
    >
      <div className="relative aspect-[4/5] bg-ivory-deep overflow-hidden">
        {product.primaryImage ? (
          <img
            src={product.primaryImage.url}
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
        {!product.inStock && (
          <span className="absolute top-3 left-3 eyebrow text-[0.56rem] bg-porcelain/90 text-ink px-2.5 py-1.5 rounded-xs border border-hairline">
            Sold out
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
        {product.tagline && (
          <p className="mt-1 text-xs text-ink-muted line-clamp-1">{product.tagline}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <ShadeDots swatches={product.swatches} />
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
