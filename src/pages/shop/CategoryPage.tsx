import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { CategoryDTO } from '@contracts/index';
import { useCategories, useProducts } from '@/features/catalog/useCatalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { GoldRule } from '@/components/brand/GoldRule';
import { cn } from '@/lib/cn';

/** Client-side instant filtering — the catalog is small, no request per keystroke. */

const PRICE_RANGES = [
  { value: '', label: 'All prices', min: 0, max: Infinity },
  { value: 'under-20', label: 'Under $20', min: 0, max: 1999 },
  { value: '20-30', label: '$20 – $30', min: 2000, max: 3000 },
  { value: 'over-30', label: 'Over $30', min: 3001, max: Infinity },
] as const;

export function CategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const isShopAll = !categorySlug;
  const activeCategory = subcategorySlug ?? categorySlug;
  const { data: categories } = useCategories();
  // Shop-all fetches everything; category pages fetch their subtree.
  const { data, isPending } = useProducts({ category: activeCategory, limit: 60 });

  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(''); // shop-all only

  const parent = categories?.find((c) => c.slug === categorySlug);
  const current =
    (subcategorySlug ? parent?.children.find((c) => c.slug === subcategorySlug) : parent) ?? null;
  const title = current?.name ?? 'Shop all';

  const filtered = useMemo(() => {
    let products = data?.products ?? [];

    if (isShopAll && categoryFilter && categories) {
      const root = categories.find((c) => c.slug === categoryFilter);
      if (root) {
        const slugs = new Set([root.slug, ...root.children.map((c) => c.slug)]);
        products = products.filter((p) => slugs.has(p.categorySlug));
      }
    }

    const range = PRICE_RANGES.find((r) => r.value === priceRange);
    if (range && range.value) {
      products = products.filter(
        (p) => p.priceCents >= range.min && p.priceCents <= range.max,
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.tagline?.toLowerCase().includes(q) ?? false) ||
          p.swatches.some((s) => s.name.toLowerCase().includes(q)),
      );
    }
    return products;
  }, [data, isShopAll, categoryFilter, categories, priceRange, search]);

  const hasActiveFilters = Boolean(search.trim() || priceRange || categoryFilter);

  return (
    <div className="mx-auto max-w-[1440px] px-gutter py-12">
      <nav className="eyebrow text-ink-muted flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
        <Link to="/shop" className="link-ink">Shop</Link>
        {parent && (
          <>
            <span aria-hidden="true">/</span>
            {subcategorySlug ? (
              <Link to={`/shop/${parent.slug}`} className="link-ink">{parent.name}</Link>
            ) : (
              <span className="text-ink">{parent.name}</span>
            )}
          </>
        )}
        {subcategorySlug && current && (
          <>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{current.name}</span>
          </>
        )}
      </nav>

      <h1 className="display text-display-2 text-ink mt-6">{title}</h1>
      {current?.description && (
        <p className="mt-3 text-body text-ink-soft max-w-xl">{current.description}</p>
      )}

      {/* subcategory rail (e.g. Lips -> Lip Products & Oil / Lip Color) */}
      {(parent?.children.length ?? 0) > 0 && (
        <div className="mt-8 flex gap-3 flex-wrap">
          <Link
            to={`/shop/${parent!.slug}`}
            className={cn(
              'eyebrow px-4 py-2 rounded-xs border transition-colors',
              !subcategorySlug
                ? 'border-gold-700 text-ink bg-porcelain'
                : 'border-hairline text-ink-soft hover:border-gold-500',
            )}
          >
            All
          </Link>
          {parent!.children.map((c) => (
            <Link
              key={c.id}
              to={`/shop/${parent!.slug}/${c.slug}`}
              className={cn(
                'eyebrow px-4 py-2 rounded-xs border transition-colors',
                subcategorySlug === c.slug
                  ? 'border-gold-700 text-ink bg-porcelain'
                  : 'border-hairline text-ink-soft hover:border-gold-500',
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* ---------- filter bar: search + price (+ category on Shop) ---------- */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="sr-only">Search products</span>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            placeholder="Search products or shades…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-porcelain border border-hairline rounded-xs pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-ink-muted"
          />
        </label>

        {isShopAll && (
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-porcelain border border-hairline rounded-xs px-3.5 py-2.5 text-sm text-ink cursor-pointer"
            >
              <option value="">All categories</option>
              {categories?.map((c: CategoryDTO) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span className="sr-only">Filter by price</span>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="bg-porcelain border border-hairline rounded-xs px-3.5 py-2.5 text-sm text-ink cursor-pointer"
          >
            {PRICE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <button
            onClick={() => { setSearch(''); setPriceRange(''); setCategoryFilter(''); }}
            className="text-xs text-ink-muted link-ink cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {!isPending && hasActiveFilters && (
        <p className="mt-4 text-xs text-ink-muted tabular" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        </p>
      )}

      <GoldRule className="mt-6 mb-10" />
      <ProductGrid
        products={filtered}
        loading={isPending}
        emptyMessage={
          hasActiveFilters ? 'Nothing matches those filters.' : `Nothing in ${title.toLowerCase()} yet.`
        }
      />
    </div>
  );
}
