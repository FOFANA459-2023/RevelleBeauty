import { useState } from 'react';
import { Link } from 'react-router';
import type { ProductSummaryDTO } from '@contracts/index';
import { useProducts, useSettings } from '@/features/catalog/useCatalog';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { Button } from '@/components/ui/Button';
import { BrandVideo } from '@/components/media/BrandVideo';
import { revealDelay, useReveal } from '@/lib/useReveal';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/cn';
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
    quote: 'The only gloss I have ever repurchased three times. Fuchsia Kiss is my whole personality now.',
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

type ShelfTab = 'bestsellers' | 'new' | 'lips';

const SHELF_TABS: { id: ShelfTab; label: string }[] = [
  { id: 'bestsellers', label: 'Bestsellers' },
  { id: 'new', label: 'New in' },
  { id: 'lips', label: 'All lips' },
];

/**
 * Shelves lead with what can be seen: products without a photograph yet (the
 * skincare line, today) would open "New in" on four blank tiles. If nothing in
 * a list has a photograph, show the list rather than an empty shelf.
 */
const photographed = (products: ProductSummaryDTO[] | undefined) => {
  const list = products ?? [];
  const shown = list.filter((p) => p.primaryImage);
  return shown.length > 0 ? shown : list;
};

export function HomePage() {
  const { data: featured, isPending: featuredPending } = useProducts({ featured: true, limit: 8 });
  const { data: lips, isPending: lipsPending } = useProducts({ category: 'lips', limit: 24 });
  const { data: newest, isPending: newestPending } = useProducts({ sort: 'newest', limit: 16 });
  const { data: settings } = useSettings();
  const [tab, setTab] = useState<ShelfTab>('bestsellers');

  // One observer for the whole page; it re-scans as each query lands.
  const pageRef = useReveal<HTMLDivElement>([
    featured?.products.length,
    lips?.products.length,
    newest?.products.length,
  ]);

  // The campaign CTA quotes a real price rather than a baked-in one: a
  // hardcoded "$22" outlived two price changes before this.
  const campaignProduct = (lips?.products ?? []).find((p) => p.slug === 'high-shine-lip-oil');

  const allShades = (lips?.products ?? [])
    .flatMap((p) => p.swatches.map((s) => ({ ...s, productSlug: p.slug })))
    .filter((s) => s.hexColor)
    .slice(0, 14);

  const shelf = {
    bestsellers: { products: photographed(featured?.products), loading: featuredPending },
    new: { products: photographed(newest?.products).slice(0, 8), loading: newestPending },
    lips: { products: photographed(lips?.products), loading: lipsPending },
  }[tab];

  return (
    <div ref={pageRef}>
      {/* ============ 1. THE SHELF: products first ============
          A shopper lands on products, not on a poster: a one-line brand
          heading, three shelves to flip between, and the grid inside the
          first screen on phone and desktop alike. The brand story that used
          to open the page now closes it (section 8), for the people who
          have scrolled far enough to want it. */}
      <section className="mx-auto max-w-[1440px] px-gutter pt-6 sm:pt-10 lg:pt-12 pb-12 sm:pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
          <div>
            <p className="eyebrow text-gold-950">Be you. Be bold. Be Revelle.</p>
            <h1 className="display text-h1 text-ink mt-2 sm:mt-3">Find your shade</h1>
          </div>
          <div className="flex items-center justify-between gap-6">
            <ShelfTabs value={tab} onChange={setTab} />
            <Link to="/shop" className="text-sm text-ink link-ink shrink-0 hidden sm:inline">
              Shop all
            </Link>
          </div>
        </div>

        <div id="home-shelf" role="tabpanel" aria-labelledby={`shelf-tab-${tab}`} className="mt-5 sm:mt-8">
          {/* Keyed so a new shelf deals its cards in rather than swapping under the eye. */}
          <ProductGrid key={tab} products={shelf.products} loading={shelf.loading} priorityCount={4} />
        </div>

        <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
          <Link to="/shop" className="w-full max-w-[340px] sm:w-auto">
            <Button variant="metal" size="lg" className="w-full">Shop all products</Button>
          </Link>
          <Link to="/shades" className="text-sm text-ink link-ink">
            or browse every shade
          </Link>
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
            data-reveal="still"
          >
            <img
              src="/media/lips-tint-collection.jpg"
              alt="Lips collection — the Lip Tint shade range"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              style={{ transitionTimingFunction: 'var(--ease-couture)' }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span
              className="absolute bottom-0 left-0 p-7 on-ink transition-transform duration-500 motion-safe:group-hover:-translate-y-1"
              style={{ transitionTimingFunction: 'var(--ease-couture)' }}
            >
              <span className="eyebrow text-gold-300 block">9 products · 40+ shades</span>
              <span className="display text-h1 text-ivory block mt-2">Lips</span>
              <span className="eyebrow text-ivory/90 mt-3 inline-flex items-center gap-2 border-b border-gold-300 pb-1">
                Shop now
                <span
                  aria-hidden="true"
                  className="text-gold-300 transition-transform duration-500 motion-safe:group-hover:translate-x-1"
                  style={{ transitionTimingFunction: 'var(--ease-couture)' }}
                >
                  →
                </span>
              </span>
            </span>
          </Link>

          <Link
            to="/shop/skincare"
            className="group relative rounded-xs overflow-hidden aspect-[16/10] block bg-ivory-deep"
            data-reveal="still"
            style={revealDelay(1, 120)}
          >
            <img
              src="/media/revelle-story-poster.jpg"
              alt="Skincare collection"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              style={{ transitionTimingFunction: 'var(--ease-couture)' }}
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span
              className="absolute bottom-0 left-0 p-7 on-ink transition-transform duration-500 motion-safe:group-hover:-translate-y-1"
              style={{ transitionTimingFunction: 'var(--ease-couture)' }}
            >
              <span className="eyebrow text-gold-300 block">New — the ritual begins</span>
              <span className="display text-h1 text-ivory block mt-2">Skincare</span>
              <span className="eyebrow text-ivory/90 mt-3 inline-flex items-center gap-2 border-b border-gold-300 pb-1">
                Discover
                <span
                  aria-hidden="true"
                  className="text-gold-300 transition-transform duration-500 motion-safe:group-hover:translate-x-1"
                  style={{ transitionTimingFunction: 'var(--ease-couture)' }}
                >
                  →
                </span>
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* ============ 4. THE SHADES rail ============ */}
      {allShades.length > 0 && (
        <section className="mt-section">
          <div className="mx-auto max-w-[1440px] px-gutter text-center">
            <p className="eyebrow text-gold-950" data-reveal>The palette</p>
            <h2 className="display text-h1 text-ink mt-4" data-reveal style={revealDelay(1, 90)}>
              The shades
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {allShades.map((s, i) => (
                <Link
                  key={s.id}
                  to={`/product/${s.productSlug}?shade=${s.slug}`}
                  aria-label={s.name}
                  className="group flex flex-col items-center gap-2"
                  data-reveal
                  style={revealDelay(i, 45, 480)}
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

      {/* ============ 5. EDITORIAL — new photography ============ */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter">
          <div className="text-center mb-10">
            <p className="eyebrow text-gold-950" data-reveal>In focus</p>
            <h2 className="display text-h1 text-ink mt-4" data-reveal style={revealDelay(1, 90)}>
              Three ways to glow
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                to: '/product/magic-tone-lip',
                src: '/media/lips-magic-tone-trio.jpg',
                alt: 'Magic Tone Lip Oil — Vanilla, Sakura, and Black Currant',
                eyebrow: 'pH-reactive',
                title: 'Magic Tone',
              },
              {
                to: '/product/diamond-lip-gloss',
                src: '/media/lips-diamond-collection.jpg',
                alt: 'Diamond Lip Gloss collection',
                eyebrow: 'Multidimensional sparkle',
                title: 'Diamond Gloss',
              },
              {
                to: '/product/sugar-lip-scrub',
                src: '/media/lips-scrub-model.jpg',
                alt: 'Sugar Lip Scrub in use',
                eyebrow: 'Buff, smooth, prep',
                title: 'Sugar Scrub',
              },
            ].map((tile, i) => (
              <Link
                key={tile.to}
                to={tile.to}
                className="group relative rounded-xs overflow-hidden aspect-[4/5] block"
                data-reveal="still"
                style={revealDelay(i, 110)}
              >
                <img
                  src={tile.src}
                  alt={tile.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  style={{ transitionTimingFunction: 'var(--ease-couture)' }}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span
                  className="absolute bottom-0 left-0 p-6 on-ink transition-transform duration-500 motion-safe:group-hover:-translate-y-1"
                  style={{ transitionTimingFunction: 'var(--ease-couture)' }}
                >
                  <span className="eyebrow text-gold-300 block">{tile.eyebrow}</span>
                  <span className="display text-h2 text-ivory block mt-1.5">{tile.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. CAMPAIGN BANNER — the Revelle banner ============ */}
      <section className="mt-section bg-porcelain border-y border-hairline">
        <div className="mx-auto max-w-[1440px] px-gutter py-16 lg:py-20 grid lg:grid-cols-2 items-center gap-12">
          <div className="relative mx-auto w-full max-w-[520px]" data-reveal="still">
            <img
              src="/media/lips-high-shine-duo.jpg"
              alt="High Shine Lip Oil in Fuchsia Kiss and Coral"
              className="w-full rounded-xs metal-ring shadow-[var(--shadow-lift)] bg-white"
            />
            <img
              src={logoImage}
              alt=""
              aria-hidden="true"
              /* The overhang is the composition; on a phone it would push the
                 whole page sideways, so it tucks back in under sm. */
              className="absolute -bottom-4 -right-2 sm:-bottom-8 sm:-right-6 w-24 h-24 lg:w-28 lg:h-28 rounded-full shadow-[var(--shadow-lift)]"
            />
          </div>
          <div className="text-center lg:text-left">
            <p className="eyebrow text-gold-950" data-reveal>The campaign</p>
            <h2 className="display text-display-2 text-ink mt-4" data-reveal style={revealDelay(1, 90)}>
              The Revelle look
            </h2>
            <p
              className="mt-6 text-body-lg text-ink-soft max-w-lg mx-auto lg:mx-0"
              data-reveal
              style={revealDelay(2, 90)}
            >
              One swipe of shine. Skin that glows on its own. This season's
              look is built on our High Shine Lip Oil — glass finish, weightless
              feel, and a shade range made to flatter every tone.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-soft max-w-md mx-auto lg:mx-0 text-left">
              {['Mirror shine without the stick', 'Botanical oils condition over time', 'Eight shades, sheer to statement'].map((t, i) => (
                <li key={t} className="flex items-start gap-3" data-reveal style={revealDelay(i + 3, 90)}>
                  <Sparkle size={12} className="text-gold-500 mt-1 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <Link to="/product/high-shine-lip-oil" className="inline-block mt-10" data-reveal style={revealDelay(6, 90)}>
              <Button variant="metal" size="lg">
                {campaignProduct
                  ? `Get the look — ${formatCents(campaignProduct.priceCents)}`
                  : 'Get the look'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 7. TESTIMONIALS ============ */}
      <section className="mt-section bg-ivory-deep/60 border-y border-hairline">
        <div className="mx-auto max-w-[1440px] px-gutter py-16 lg:py-20">
          <div className="text-center mb-12" data-reveal>
            <p className="eyebrow text-gold-950">Loved loudly</p>
            <h2 className="display text-h1 text-ink mt-4">From the Revelle community</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <figure
                key={t.name}
                className="bg-porcelain border border-hairline rounded-sm p-7 flex flex-col"
                data-reveal
                style={revealDelay(i, 110)}
              >
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

      {/* ============ 8. THE BRAND: the old cover, now the closing chapter ============
          The campaign photograph and film with the slogan, for the shopper
          who has browsed and wants to know who is behind it. It ends on the
          shop again, so the story leads back to the products. */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter grid lg:grid-cols-12 items-center gap-8 lg:gap-12">
          <div className="lg:col-span-7">
            <div
              className="grid grid-cols-2 sm:grid-cols-[1fr_1.2fr] gap-3 sm:gap-4 lg:gap-5 items-center max-w-[340px] sm:max-w-[560px] lg:max-w-[680px] mx-auto lg:ml-0"
              data-reveal="still"
            >
              <img
                src={campaignImage}
                alt="The Revelle campaign"
                loading="lazy"
                decoding="async"
                className="w-full aspect-[4/5] sm:aspect-[3/4] object-cover rounded-xs metal-ring shadow-[var(--shadow-lift)] lg:translate-y-8"
              />
              <div className="aspect-[4/5] sm:aspect-[3/4] rounded-xs metal-ring overflow-hidden shadow-[var(--shadow-lift)] lg:-translate-y-4">
                <BrandVideo src="/media/revelle-hero.mp4" poster="/media/revelle-hero-poster.jpg" preload="none" className="h-full w-full" />
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 text-center lg:text-left">
            <p className="eyebrow text-gold-950" data-reveal>Our philosophy</p>
            <h2 className="display text-display-2 text-ink mt-4" data-reveal style={revealDelay(1, 90)}>
              Be you.
              <br />
              Be bold.
              <br />
              Be Revelle.
            </h2>
            <GoldRule ornament className="w-36 sm:w-44 mt-6 mx-auto lg:mx-0" data-reveal="draw" style={revealDelay(2, 90)} />
            <p className="mt-6 text-body-lg text-ink-soft max-w-md mx-auto lg:mx-0" data-reveal style={revealDelay(3, 90)}>
              Lip color designed around one idea: the shade is the star, and
              everything else steps back. Nourishing oils, weightless mattes and
              glass-like glosses in colors chosen to flatter every tone.
            </p>
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-ink-muted" data-reveal style={revealDelay(4, 90)}>
              <span>40+ shades</span>
              <span className="w-px h-4 bg-hairline" aria-hidden="true" />
              <span>Clean formulas</span>
              <span className="w-px h-4 bg-hairline" aria-hidden="true" />
              <span>Cruelty free</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start" data-reveal style={revealDelay(5, 90)}>
              <Link to="/shop">
                <Button variant="metal" size="lg">Shop the shades</Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg">Our story</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 9. VALUE PROPS ============ */}
      <section className="mt-section">
        <div className="mx-auto max-w-[1440px] px-gutter">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUE_PROPS.map((v, i) => (
              <div
                key={v.title}
                className="border border-hairline rounded-sm bg-porcelain p-6 text-center"
                data-reveal
                style={revealDelay(i, 90)}
              >
                <Sparkle size={16} className="text-gold-500" />
                <h3 className="eyebrow text-ink mt-4">{v.title}</h3>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 10. NEWSLETTER ============ */}
      <NewsletterBand announcement={settings?.announcement ?? null} />
    </div>
  );
}

/**
 * The shelf switcher. Real tabs: arrow keys move between them and the
 * selected one is the only one in the tab order.
 */
function ShelfTabs({ value, onChange }: { value: ShelfTab; onChange: (tab: ShelfTab) => void }) {
  const move = (from: number, step: number) => {
    const next = SHELF_TABS[(from + step + SHELF_TABS.length) % SHELF_TABS.length]!;
    onChange(next.id);
    document.getElementById(`shelf-tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label="Shop by" className="flex gap-5 sm:gap-7">
      {SHELF_TABS.map((t, i) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            id={`shelf-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="home-shelf"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') move(i, 1);
              else if (e.key === 'ArrowLeft') move(i, -1);
            }}
            className={cn(
              'eyebrow py-2 border-b transition-colors duration-300 cursor-pointer',
              selected ? 'text-ink border-gold-500' : 'text-ink-muted border-transparent hover:text-ink',
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
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
