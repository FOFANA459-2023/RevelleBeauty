import { Link, useParams } from 'react-router';
import { useCategories, useProducts } from '@/features/catalog/useCatalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { GoldRule } from '@/components/brand/GoldRule';
import { cn } from '@/lib/cn';

export function CategoryPage() {
  const { categorySlug, subcategorySlug } = useParams();
  const active = subcategorySlug ?? categorySlug; // undefined = all products
  const { data: categories } = useCategories();
  const { data, isPending } = useProducts({ category: active, limit: 60 });

  const parent = categories?.find((c) => c.slug === categorySlug);
  const current =
    (subcategorySlug ? parent?.children.find((c) => c.slug === subcategorySlug) : parent) ?? null;

  const title = current?.name ?? 'All products';

  return (
    <div className="mx-auto max-w-[1440px] px-gutter py-12">
      <nav className="eyebrow text-ink-muted flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
        <Link to="/shop" className="link-ink">Shop</Link>
        {parent && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/shop/${parent.slug}`} className="link-ink">{parent.name}</Link>
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

      {/* subcategory filter rail */}
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

      <GoldRule className="mt-8 mb-10" />
      <ProductGrid
        products={data?.products ?? []}
        loading={isPending}
        emptyMessage={`Nothing in ${title.toLowerCase()} yet.`}
      />
    </div>
  );
}
