import type { ProductSummaryDTO } from '@contracts/index';
import { ProductCard } from './ProductCard';
import { Sparkle } from '@/components/brand/Sparkle';

/** 2 cols on mobile (shade ranges scan better), 3 at md, 4 at xl. */
export function ProductGrid({
  products,
  loading = false,
  emptyMessage = 'Nothing here yet.',
}: {
  products: ProductSummaryDTO[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="skeleton aspect-[4/5]" />
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <Sparkle size={28} className="text-gold-300" />
        <p className="mt-6 font-display text-h3 text-ink">{emptyMessage}</p>
        <p className="mt-2 text-sm text-ink-muted">New arrivals are on their way.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
