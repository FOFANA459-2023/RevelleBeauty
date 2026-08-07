import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { Wordmark } from '@/components/brand/Wordmark';
import { useCart, selectItemCount } from '@/features/cart/cartStore';
import {
  useAccountOrders,
  useCustomer,
  useCustomerLogout,
  useMessages,
} from '@/features/auth/useCustomer';
import type { FulfillmentStage } from '@contracts/index';
import { cn } from '@/lib/cn';
import logo from '@/assets/logo.jpg';

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop/lips', label: 'Lips' },
  { to: '/shop/skincare', label: 'Skincare' },
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
                end={n.to === '/shop'}
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

          {/* center: logo mark + wordmark */}
          <Link
            to="/"
            aria-label="Revelle Beauty — home"
            className="justify-self-center flex items-center gap-3"
          >
            <img
              src={logo}
              alt=""
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0"
            />
            <Wordmark variant="ink" size="sm" />
          </Link>

          {/* right: account + bag */}
          <div className="justify-self-end flex items-center gap-1 sm:gap-3">
            <AccountMenu />
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
                end={n.to === '/shop'}
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

const ACCOUNT_LINKS = [
  { to: '/account', label: 'My account' },
  { to: '/account/addresses', label: 'Addresses' },
  { to: '/account/orders', label: 'Orders' },
  { to: '/account/messages', label: 'Messages' },
];

/** Stages that appear on the mini progress bar, in order. */
const TRACK_STAGES: FulfillmentStage[] = ['payment_received', 'packaged', 'shipped', 'delivered'];

/** Compact horizontal tracking bar for the account dropdown. */
function MiniTracking({ stage }: { stage: FulfillmentStage }) {
  const idx = TRACK_STAGES.indexOf(stage);
  return (
    <span className="flex items-center gap-1 w-full" aria-label={`Progress: ${stage.replace(/_/g, ' ')}`}>
      {TRACK_STAGES.map((s, i) => (
        <span
          key={s}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            i <= idx ? 'bg-gold-700' : 'bg-hairline',
          )}
        />
      ))}
    </span>
  );
}

/**
 * The profile icon. Signed out: straight to /login. Signed in: a small
 * dropdown — account, addresses, orders, messages — plus the admin
 * dashboard for admins and sign out. Closes on outside click and Escape.
 */
function AccountMenu() {
  const { data: me } = useCustomer();
  const { data: inbox } = useMessages(Boolean(me));
  const { data: orders } = useAccountOrders(Boolean(me));
  const logout = useCustomerLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = inbox?.unreadCount ?? 0;
  // Orders still moving through the pipeline — shown with a progress bar.
  const inTransit = (orders ?? []).filter((o) => o.fulfillmentStage !== 'delivered').slice(0, 2);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const icon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );

  if (!me) {
    return (
      <Link to="/login" aria-label="Sign in" className="p-2 text-ink hover:text-ink-soft">
        {icon}
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-label={unread > 0 ? `My account menu, ${unread} unread messages` : 'My account menu'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-ink hover:text-ink-soft cursor-pointer"
      >
        {icon}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gold-700 text-porcelain text-[0.6rem] grid place-items-center tabular">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 bg-porcelain border border-hairline rounded-sm shadow-[var(--shadow-lift)] py-2 z-50 animate-[fadein_150ms_ease]"
        >
          <p className="px-4 py-2 text-xs text-ink-muted border-b border-hairline truncate">
            {me.name}
          </p>
          {ACCOUNT_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-ink-soft hover:text-ink hover:bg-ivory transition-colors"
            >
              {l.label}
              {l.label === 'Messages' && unread > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-gold-700 text-porcelain text-[0.6rem] grid place-items-center tabular">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          ))}
          {inTransit.length > 0 && (
            <div className="border-t border-hairline pt-2 mt-1">
              <p className="px-4 pb-1 text-[0.6rem] uppercase tracking-wider text-ink-muted">Order tracking</p>
              {inTransit.map((o) => (
                <Link
                  key={o.id}
                  to={`/account/orders/${o.id}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-ivory transition-colors"
                >
                  <span className="flex items-center justify-between text-xs text-ink mb-1.5">
                    <span className="tabular">{o.orderNumber}</span>
                    <span className="text-ink-muted capitalize">{o.fulfillmentStage.replace(/_/g, ' ')}</span>
                  </span>
                  <MiniTracking stage={o.fulfillmentStage} />
                </Link>
              ))}
            </div>
          )}
          {me.role === 'admin' && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gold-950 hover:bg-ivory border-t border-hairline transition-colors"
            >
              Admin dashboard →
            </Link>
          )}
          <button
            role="menuitem"
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => {
                  setOpen(false);
                  navigate('/');
                },
              })
            }
            className="block w-full text-left px-4 py-2.5 text-sm text-ink-muted hover:text-ink hover:bg-ivory border-t border-hairline cursor-pointer transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
