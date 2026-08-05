import { Link } from 'react-router';
import { useProducts } from '@/features/catalog/useCatalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { Button } from '@/components/ui/Button';
import { BrandVideo } from '@/components/media/BrandVideo';
import campaignImage from '@/assets/revelle-campaign.jpg';

export function HomePage() {
  const { data: featured, isPending } = useProducts({ featured: true, limit: 8 });
  const { data: all } = useProducts({ limit: 60 });

  const allShades = (all?.products ?? [])
    .flatMap((p) => p.swatches.map((s) => ({ ...s, productSlug: p.slug })))
    .filter((s) => s.hexColor)
    .slice(0, 14);

  return (
    <>
      {/* ============ HERO — split editorial (videos are 576px portrait; a
           full-bleed desktop hero would be visibly soft) ============ */}
      <section className="mx-auto max-w-[1440px] px-gutter">
        <div className="grid lg:grid-cols-12 items-center gap-10 lg:gap-6 min-h-[70svh] py-10 lg:py-6">
          {/* Mobile: video first. Desktop: text left, video right. */}
          <div className="order-2 lg:order-1 lg:col-span-6 text-center lg:text-left">
            <p className="eyebrow text-gold-950">Revelle Beauty</p>
            <h1 className="display text-display-1 text-ink mt-6">
              Be you.
              <br />
              Be bold.
              <br />
              Be Revelle.
            </h1>
            <GoldRule ornament className="w-44 mt-8 mx-auto lg:mx-0" />
            <p className="mt-8 text-body-lg text-ink-soft max-w-md mx-auto lg:mx-0">
              Lip color designed around one idea: the shade is the star, and
              everything else steps back.
            </p>
            <Link to="/shop" className="inline-block mt-10">
              <Button variant="metal" size="lg">Shop the shades</Button>
            </Link>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8 relative">
            {/* offset campaign image behind — editorial collage */}
            <img
              src={campaignImage}
              alt=""
              aria-hidden="true"
              className="hidden lg:block absolute -left-16 top-14 w-[55%] rounded-xs opacity-90 shadow-[var(--shadow-lift)]"
            />
            <div className="relative mx-auto max-w-[440px] aspect-[3/4] rounded-xs metal-ring overflow-hidden shadow-[var(--shadow-lift)]">
              <BrandVideo src="/media/revelle-hero.mp4" poster={campaignImage} className="h-full w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ THE SHADES rail — polychrome moment #1 ============ */}
      {allShades.length > 0 && (
        <section className="mt-section">
          <div className="mx-auto max-w-[1440px] px-gutter text-center">
            <p className="eyebrow text-gold-950">The palette</p>
            <h2 className="display text-h1 text-ink mt-4">The shades</h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {allShades.map((s) => (
                <Link
                  key={s.id}
                  to={`/product/${s.productSlug}?shade=${s.slug}`}
                  aria-label={s.name}
                  className="group flex flex-col items-center gap-2"
                >
                  <ShadeSwatch
                    hex={s.hexColor!}
                    hexSecondary={s.hexColorSecondary}
                    name={s.name}
                    size={40}
                    interactive={false}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span className="shade-name text-xs text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {s.name}
                  </span>
                </Link>
              ))}
            </div>
            <Link to="/shades" className="inline-block mt-8 text-sm text-ink link-ink">
              Explore the shade library
            </Link>
          </div>
        </section>
      )}

      {/* ============ THE COLLECTION ============ */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow text-gold-950">Featured</p>
              <h2 className="display text-h1 text-ink mt-4">The collection</h2>
            </div>
            <Link to="/shop" className="text-sm text-ink link-ink hidden sm:inline">
              View all
            </Link>
          </div>
          <ProductGrid products={featured?.products ?? []} loading={isPending} />
        </div>
      </section>

      {/* ============ BRAND STORY band ============ */}
      <section className="mt-section bg-porcelain border-y border-hairline">
        <div className="mx-auto max-w-[1440px] px-gutter py-16 lg:py-24 grid lg:grid-cols-2 items-center gap-12">
          <div className="mx-auto max-w-[360px] w-full aspect-[9/16] rounded-xs metal-ring overflow-hidden">
            <BrandVideo src="/media/revelle-story.mp4" preload="none" className="h-full w-full" />
          </div>
          <div className="text-center lg:text-left">
            <p className="eyebrow text-gold-950">Our philosophy</p>
            <h2 className="display text-h1 text-ink mt-4">
              Color belongs to you
            </h2>
            <p className="mt-6 text-body-lg text-ink-soft max-w-lg mx-auto lg:mx-0">
              Every Revelle formula is built to let your shade speak — nourishing
              oils, weightless mattes, and glass-like glosses in colors chosen to
              flatter, never to shout.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md mx-auto lg:mx-0">
              {['Cruelty free', 'Clean formulas', 'Shade first'].map((t) => (
                <div key={t} className="flex flex-col items-center lg:items-start gap-2">
                  <Sparkle size={14} className="text-gold-500" />
                  <span className="eyebrow text-ink-soft text-[0.6rem]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
