import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { VariantDTO } from '@contracts/index';
import { useProduct } from '@/features/catalog/useCatalog';
import { useCart } from '@/features/cart/cartStore';
import { ShadePicker } from '@/components/shade/ShadePicker';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/cn';

export function ProductPage() {
  const { productSlug } = useParams();
  const { data: product, isPending, isError } = useProduct(productSlug ?? '');
  const [searchParams, setSearchParams] = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const add = useCart((s) => s.add);

  // Selected variant mirrors ?shade= — deep-linkable, back-button-correct.
  const selected: VariantDTO | null = useMemo(() => {
    if (!product) return null;
    const fromUrl = searchParams.get('shade');
    return (
      product.variants.find((v) => v.slug === fromUrl) ??
      product.variants.find((v) => v.isDefault) ??
      product.variants[0] ??
      null
    );
  }, [product, searchParams]);

  const selectVariant = (v: VariantDTO) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('shade', v.slug);
      return next;
    }, { replace: false });
  };

  // Gallery: variant image wins, else primary, crossfade on change.
  const heroImage = useMemo(() => {
    if (!product) return null;
    if (selected?.imageId) {
      const vi = product.images.find((i) => i.id === selected.imageId);
      if (vi) return vi;
    }
    return product.images.find((i) => i.isPrimary) ?? product.images[0] ?? null;
  }, [product, selected]);

  useEffect(() => {
    setQuantity(1);
    setAdded(false);
  }, [selected?.id]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-[1440px] px-gutter py-12 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7"><div className="skeleton aspect-[4/5]" /></div>
        <div className="lg:col-span-5 space-y-4">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-6 w-24" />
          <div className="skeleton h-32 w-full mt-10" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="py-32 text-center">
        <Sparkle size={28} className="text-gold-300" />
        <p className="mt-6 font-display text-h2 text-ink">This product has slipped away.</p>
        <Link to="/shop" className="mt-6 inline-block text-sm link-ink text-ink">
          Return to the collection
        </Link>
      </div>
    );
  }

  const price = selected?.priceCents ?? product.priceCents;
  const canBuy = Boolean(selected?.inStock);
  const isShade = Boolean(selected?.hexColor);

  const onAdd = () => {
    if (!selected) return;
    add(
      {
        variantId: selected.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        shadeName: selected.name,
        shadeHex: selected.hexColor,
        shadeHexSecondary: selected.hexColorSecondary,
        imageUrl: heroImage?.url ?? null,
        unitPriceCents: selected.priceCents,
        maxQuantity: 10,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-gutter py-8 lg:py-12">
      <nav className="eyebrow text-ink-muted flex items-center gap-2" aria-label="Breadcrumb">
        <Link to="/shop" className="link-ink">Shop</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/shop/${product.categorySlug}`} className="link-ink capitalize">
          {product.categorySlug.replace(/-/g, ' ')}
        </Link>
      </nav>

      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mt-8">
        {/* ---------- gallery ---------- */}
        <div className="lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <div className="aspect-[4/5] bg-ivory-deep rounded-xs overflow-hidden grid place-items-center">
              {heroImage ? (
                <img
                  key={heroImage.id}
                  src={heroImage.url}
                  alt={heroImage.altText ?? product.name}
                  className="h-full w-full object-contain animate-[fadein_400ms_ease]"
                />
              ) : isShade && selected?.hexColor ? (
                <ShadeSwatch
                  key={selected.id}
                  hex={selected.hexColor}
                  hexSecondary={selected.hexColorSecondary}
                  name={selected.name}
                  size={180}
                  interactive={false}
                />
              ) : (
                <span className="font-display text-6xl text-gold-300 select-none">RB</span>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {product.images.slice(0, 5).map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      'w-20 aspect-square bg-ivory-deep rounded-xs overflow-hidden border',
                      heroImage?.id === img.id ? 'border-gold-700' : 'border-hairline',
                    )}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------- buy column ---------- */}
        <div className="lg:col-span-5">
          <h1 className="display text-display-2 text-ink">{product.name}</h1>
          <p className="mt-3 text-body-lg tabular text-ink-soft">{formatCents(price)}</p>
          {product.tagline && (
            <p className="mt-4 text-body text-ink-soft">{product.tagline}</p>
          )}

          {/* THE SHADE PICKER — most whitespace in the column, on purpose */}
          <div className="mt-14 mb-10">
            <ShadePicker
              label={product.variantLabel}
              variants={product.variants}
              value={selected}
              onChange={selectVariant}
            />
          </div>

          <div className="flex gap-3 items-stretch">
            <QuantityStepper value={quantity} max={10} onChange={setQuantity} />
            <Button
              variant="metal"
              size="lg"
              className="flex-1"
              disabled={!canBuy}
              onClick={onAdd}
            >
              {added ? (
                <span className="flex items-center gap-2">
                  <Sparkle size={11} /> Added
                </span>
              ) : canBuy ? (
                `Add to bag — ${formatCents(price * quantity)}`
              ) : (
                'Sold out'
              )}
            </Button>
          </div>

          {/* accordions: hairline dividers, no boxes */}
          <div className="mt-12">
            <GoldRule />
            {[
              { title: 'Details', body: product.description },
              { title: 'Ingredients', body: product.ingredients },
              { title: 'How to wear', body: product.howToUse },
              {
                title: 'Shipping & returns',
                body: 'Complimentary shipping on qualifying orders. Returns accepted within 30 days, unopened.',
              },
            ]
              .filter((s) => s.body)
              .map((s) => (
                <details key={s.title} className="group border-b border-hairline">
                  <summary className="flex items-center justify-between py-5 cursor-pointer list-none eyebrow text-ink">
                    {s.title}
                    <span className="text-gold-700 transition-transform group-open:rotate-45 text-base leading-none" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className="pb-6 text-sm text-ink-soft whitespace-pre-line">{s.body}</p>
                </details>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
