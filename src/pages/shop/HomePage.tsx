import { useState } from 'react';
import { Link } from 'react-router';
import { useProducts, useSettings } from '@/features/catalog/useCatalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCard } from '@/components/product/ProductCard';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { Button } from '@/components/ui/Button';
import { BrandVideo } from '@/components/media/BrandVideo';
import campaignImage from '@/assets/revelle-campaign.jpg';
import logoImage from '@/assets/logo.jpg';

const MARQUEE_ITEMS = [
  'Be you. Be bold. Be Revelle.',
  'Free shipping over $50',
  'Clean formulas',
  'Cruelty free',
  'The shade is the star',
];

const TESTIMONIALS = [
  {
    quote: 'The only gloss I have ever repurchased three times. Cherry Sheen is my whole personality now.',
    name: 'Amara J.',
    product: 'High Shine Lip Oil',
  },
  {
    quote: 'Finally a matte that does not turn to dust by 2pm. The color payoff is unreal.',
    name: 'Dani R.',
    product: 'Creamy Matte Lipstick',
  },
  {
    quote: 'I bought one shade, came back for four. The swatches online match real life exactly.',
    name: 'Leila M.',
    product: 'Lip Lustre Lip Gloss',
  },
];

const VALUE_PROPS = [
  { title: 'Complimentary shipping', body: 'On every order over $50 — no code needed.' },
  { title: 'Clean formulas', body: 'Nourishing ingredients, nothing your lips do not need.' },
  { title: 'Cruelty free', body: 'Never tested on animals. Ever.' },
  { title: 'Shade-first design', body: 'Every product built around the color it carries.' },
];

export function HomePage() {
  const { data: featured, isPending } = useProducts({ featured: true, limit: 8 });
  const { data: all } = useProducts({ limit: 60 });
  const { data: newest } = useProducts({ sort: 'newest', limit: 8 });
  const { data: settings } = useSettings();

  const allShades = (all?.products ?? [])
    .flatMap((p) => p.swatches.map((s) => ({ ...s, productSlug: p.slug })))
    .filter((s) => s.hexColor)
    .slice(0, 14);

  return (
    <>
      {/* ============ 1. HERO — split editorial ============ */}
      <section className="mx-auto max-w-[1440px] px-gutter">
        <div className="grid lg:grid-cols-12 items-center gap-10 lg:gap-6 min-h-[70svh] py-10 lg:py-6">
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
            <div className="mt-10 flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link to="/shop">
                <Button variant="metal" size="lg">Shop the shades</Button>
              </Link>
              <Link to="/shop/skincare">
                <Button variant="outline" size="lg">Discover skincare</Button>
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 lg:col-start-8 relative">
            <img
              src={campaignImage}
              alt=""
              aria-hidden="true"
              className="hidden lg:block absolute -left-16 top-14 w-[55%] rounded-xs opacity-90 shadow-[var(--shadow-lift)]"
            />
            <div className="relative mx-auto max-w-[440px] aspect-[3/4] rounded-xs metal-ring overflow-hidden shadow-[var(--shadow-lift)]">
              <BrandVideo src="/media/revelle-hero.mp4" poster="/media/revelle-hero-poster.jpg" className="h-full w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ 2. MARQUEE strip ============ */}
      <div className="marquee border-y border-hairline py-3.5 bg-porcelain" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="inline-flex items-center">
              {MARQUEE_ITEMS.map((item) => (
                <span key={item} className="inline-flex items-center">
                  <span className="eyebrow text-ink-soft px-6">{item}</span>
                  <Sparkle size={10} className="text-gold-500" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ============ 3. CATEGORY TILES ============ */}
      <section className="mx-auto max-w-[1440px] px-gutter mt-16 lg:mt-24">
        <div className="grid sm:grid-cols-2 gap-5">
          <Link
            to="/shop/lips"
            className="group relative rounded-xs overflow-hidden aspect-[16/10] block"
          >
            <img
              src={campaignImage}
              alt="Lips collection"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              style={{ transitionTimingFunction: 'var(--ease-couture)' }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <span className="absolute bottom-0 left-0 p-7 on-ink">
              <span className="eyebrow text-gold-300 block">12 products · 40+ shades</span>
              <span className="display text-h1 text-ivory block mt-2">Lips</span>
              <span className="eyebrow text-ivory/90 mt-3 inline-block border-b border-gold-300 pb-1">
                Shop now
              </span>
            </span>
          </Link>

          <Link
            to="/shop/skincare"
            className="group relative rounded-xs overflow-hidden aspect-[16/10] block bg-ivory-deep"
          >
            <img
              src="/media/revelle-story-poster.jpg"
              alt="Skincare collection"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              style={{ transitionTimingFunction: 'var(--ease-couture)' }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <span className="absolute bottom-0 left-0 p-7 on-ink">
              <span className="eyebrow text-gold-300 block">New — the ritual begins</span>
              <span className="display text-h1 text-ivory block mt-2">Skincare</span>
              <span className="eyebrow text-ivory/90 mt-3 inline-block border-b border-gold-300 pb-1">
                Discover
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* ============ 4. THE SHADES rail ============ */}
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
              Explore the full shade library
            </Link>
          </div>
        </section>
      )}

      {/* ============ 5. CAMPAIGN BANNER — the Revelle banner ============ */}
      <section className="mt-section bg-porcelain border-y border-hairline">
        <div className="mx-auto max-w-[1440px] px-gutter py-16 lg:py-20 grid lg:grid-cols-2 items-center gap-12">
          <div className="relative mx-auto w-full max-w-[520px]">
            <img
              src={campaignImage}
              alt="The Revelle campaign — High Shine Lip Oil"
              className="w-full rounded-xs metal-ring shadow-[var(--shadow-lift)]"
            />
            <img
              src={logoImage}
              alt=""
              aria-hidden="true"
              className="absolute -bottom-8 -right-6 w-24 h-24 lg:w-28 lg:h-28 rounded-full shadow-[var(--shadow-lift)]"
            />
          </div>
          <div className="text-center lg:text-left">
            <p className="eyebrow text-gold-950">The campaign</p>
            <h2 className="display text-display-2 text-ink mt-4">
              The Revelle look
            </h2>
            <p className="mt-6 text-body-lg text-ink-soft max-w-lg mx-auto lg:mx-0">
              One swipe of shine. Skin that glows on its own. This season's
              look is built on our High Shine Lip Oil — glass finish, weightless
              feel, and a shade range made to flatter every tone.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-soft max-w-md mx-auto lg:mx-0 text-left">
              {['Mirror shine without the stick', 'Botanical oils condition over time', 'Five shades, sheer to statement'].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Sparkle size={12} className="text-gold-500 mt-1 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/product/high-shine-lip-oil" className="inline-block mt-10">
              <Button variant="metal" size="lg">Get the look — $22</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 6. FEATURED COLLECTION ============ */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow text-gold-950">Bestsellers</p>
              <h2 className="display text-h1 text-ink mt-4">The collection</h2>
            </div>
            <Link to="/shop" className="text-sm text-ink link-ink hidden sm:inline">
              View all
            </Link>
          </div>
          <ProductGrid products={featured?.products ?? []} loading={isPending} />
        </div>
      </section>

      {/* ============ 7. NEW ARRIVALS rail (horizontal scroll) ============ */}
      {(newest?.products.length ?? 0) > 0 && (
        <section className="mt-section">
          <div className="mx-auto max-w-[1440px] px-gutter">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="eyebrow text-gold-950">Just landed</p>
                <h2 className="display text-h1 text-ink mt-4">New arrivals</h2>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-5 px-gutter mx-auto max-w-[1440px] w-max min-w-full">
              {newest!.products.map((p) => (
                <div key={p.id} className="w-[240px] sm:w-[280px] shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ 8. TESTIMONIALS ============ */}
      <section className="mt-section bg-ivory-deep/60 border-y border-hairline">
        <div className="mx-auto max-w-[1440px] px-gutter py-16 lg:py-20">
          <div className="text-center mb-12">
            <p className="eyebrow text-gold-950">Loved loudly</p>
            <h2 className="display text-h1 text-ink mt-4">From the Revelle community</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="bg-porcelain border border-hairline rounded-sm p-7 flex flex-col">
                <div className="flex gap-1 text-gold-700" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Sparkle key={i} size={11} />
                  ))}
                </div>
                <blockquote className="mt-5 font-display text-lg leading-relaxed text-ink flex-1">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6">
                  <p className="eyebrow text-ink">{t.name}</p>
                  <p className="text-xs text-ink-muted mt-1">on {t.product}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 9. STORY VIDEO band ============ */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter grid lg:grid-cols-2 items-center gap-12">
          <div className="mx-auto max-w-[360px] w-full aspect-[9/16] rounded-xs metal-ring overflow-hidden order-1 lg:order-2">
            <BrandVideo src="/media/revelle-story.mp4" poster="/media/revelle-story-poster.jpg" preload="none" className="h-full w-full" />
          </div>
          <div className="text-center lg:text-left order-2 lg:order-1">
            <p className="eyebrow text-gold-950">Our philosophy</p>
            <h2 className="display text-h1 text-ink mt-4">Color belongs to you</h2>
            <p className="mt-6 text-body-lg text-ink-soft max-w-lg mx-auto lg:mx-0">
              Every Revelle formula is built to let your shade speak — nourishing
              oils, weightless mattes, and glass-like glosses in colors chosen to
              flatter, never to shout.
            </p>
            <Link to="/about" className="inline-block mt-8 text-sm text-ink link-ink">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 10. VALUE PROPS ============ */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="border border-hairline rounded-sm bg-porcelain p-6 text-center">
                <Sparkle size={16} className="text-gold-500" />
                <h3 className="eyebrow text-ink mt-4">{v.title}</h3>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 11. NEWSLETTER ============ */}
      <NewsletterBand announcement={settings?.announcement ?? null} />
    </>
  );
}

function NewsletterBand({ announcement }: { announcement: string | null }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  return (
    <section className="mt-section bg-porcelain border-t border-hairline">
      <div className="mx-auto max-w-2xl px-gutter py-16 text-center">
        <Sparkle size={20} className="text-gold-500" />
        <h2 className="display text-h2 text-ink mt-5">Join the list</h2>
        <p className="mt-3 text-body text-ink-soft">
          New shades, early access, and the occasional love letter.
          {announcement ? ' Plus: ' + announcement.toLowerCase() + '.' : ''}
        </p>
        {done ? (
          <p className="mt-8 shade-name text-h3 text-ink" aria-live="polite">
            You're in. Welcome to Revelle.
          </p>
        ) : (
          <form
            className="mt-8 flex gap-3 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              if (email.includes('@')) setDone(true);
            }}
          >
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full metal-border rounded-xs px-4 py-3.5 text-sm text-ink bg-porcelain"
              />
            </label>
            <Button variant="metal" type="submit">Sign up</Button>
          </form>
        )}
        <p className="mt-4 text-xs text-ink-muted">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}
