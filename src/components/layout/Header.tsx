import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Wordmark } from '@/components/brand/Wordmark';
import { useCart, selectItemCount } from '@/features/cart/cartStore';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/shades', label: 'Shades' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/**
 * Transparent over the hero, solidifies to porcelain + hairline on scroll
 * via an IntersectionObserver sentinel (no scroll listener).
 * Wordmark centered — the luxury-house convention.
 */
export function Header({ onOpenCart }: { onOpenCart: () => void }) {
  const [solid, setSolid] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const itemCount = useCart(selectItemCount);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setSolid(!(entry?.isIntersecting ?? true)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-6 w-px" />
      <header
        className={cn(
          'sticky top-0 z-40 transition-colors duration-300',
          solid ? 'bg-porcelain/95 backdrop-blur-sm border-b border-hairline' : 'bg-transparent',
        )}
      >
        <div className="mx-auto max-w-[1440px] px-gutter grid grid-cols-[1fr_auto_1fr] items-center h-16 sm:h-20">
          {/* left: nav (desktop) / hamburger (mobile) */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn('eyebrow link-ink py-1', isActive ? 'text-ink' : 'text-ink-soft')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <button
            className="lg:hidden justify-self-start p-2 -ml-2 text-ink cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span aria-hidden="true" className="block w-5 space-y-1.5">
              <span className={cn('block h-px bg-current transition-transform', mobileOpen && 'translate-y-[3.5px] rotate-45')} />
              <span className={cn('block h-px bg-current transition-opacity', mobileOpen && 'opacity-0')} />
              <span className={cn('block h-px bg-current transition-transform', mobileOpen && '-translate-y-[3.5px] -rotate-45')} />
            </span>
          </button>

          {/* center: wordmark */}
          <Link to="/" aria-label="Revelle Beauty — home" className="justify-self-center">
            <Wordmark variant="ink" size="sm" />
          </Link>

          {/* right: bag */}
          <div className="justify-self-end flex items-center gap-4">
            <button
              onClick={onOpenCart}
              aria-label={`Open bag, ${itemCount} items`}
              className="relative p-2 -mr-2 text-ink hover:text-ink-soft cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 8h12l-1 13H7L6 8z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink text-porcelain text-[0.6rem] grid place-items-center tabular">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* mobile nav sheet */}
        {mobileOpen && (
          <nav
            aria-label="Primary"
            className="lg:hidden bg-porcelain border-b border-hairline px-gutter py-4 space-y-1"
          >
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setMobileOpen(false)}
                className="block eyebrow text-ink py-3"
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
