import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useCustomer, useCustomerLogout, useMessages } from '@/features/auth/useCustomer';
import { Wordmark } from '@/components/brand/Wordmark';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
];

/**
 * Utilitarian admin shell: borrows tokens (colors, Jost, gold focus ring),
 * rejects the couture (no Cormorant body, no metallic chrome, dense rhythm).
 * Desktop: fixed sidebar. Mobile: compact top bar, so tables get the full
 * width of the phone. The client guard is UX only — every /api/admin route
 * enforces role=admin on the server itself.
 */
export function AdminLayout() {
  const { data: me, isPending, isError } = useCustomer();
  const { data: inbox } = useMessages(Boolean(me));
  const logout = useCustomerLogout();
  const navigate = useNavigate();
  const location = useLocation();

  if (isPending) {
    return <div className="min-h-dvh bg-ivory grid place-items-center text-sm text-ink-muted">Loading…</div>;
  }
  // Not signed in: send to the one shared login, then come back here.
  if (isError || !me) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  // Signed in but not an admin: the dashboard does not exist for you.
  if (me.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const unread = inbox?.unreadCount ?? 0;

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'block px-3 py-2 rounded-md transition-colors whitespace-nowrap',
      isActive ? 'bg-ivory-deep text-ink font-medium' : 'text-ink-soft hover:bg-ivory',
    );

  const messagesBadge = unread > 0 && (
    <span className="ml-1.5 inline-grid place-items-center min-w-4 h-4 px-1 rounded-full bg-gold-700 text-porcelain text-[0.6rem] tabular align-middle">
      {unread > 9 ? '9+' : unread}
    </span>
  );

  return (
    <div className="min-h-dvh bg-ivory flex flex-col lg:flex-row text-[14px]">
      {/* Mobile: top bar */}
      <header className="lg:hidden bg-porcelain border-b border-hairline px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wordmark variant="ink" size="sm" />
            <span className="eyebrow text-[0.56rem] text-ink-muted">Admin</span>
          </div>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}
            className="text-[13px] text-ink-muted cursor-pointer"
          >
            Sign out
          </button>
        </div>
        <nav className="mt-2 flex gap-1 overflow-x-auto" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={navLink}>{n.label}</NavLink>
          ))}
          <NavLink to="/account/messages" className={navLink}>
            Messages{messagesBadge}
          </NavLink>
          <a href="/" className="block px-3 py-2 text-ink-soft whitespace-nowrap">Store ↗</a>
        </nav>
      </header>

      {/* Desktop: sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-porcelain border-r border-hairline flex-col">
        <div className="p-5 border-b border-hairline">
          <Wordmark variant="ink" size="sm" />
          <p className="eyebrow text-[0.56rem] text-ink-muted mt-2">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={navLink}>{n.label}</NavLink>
          ))}
          <NavLink to="/account/messages" className={navLink}>
            Messages{messagesBadge}
          </NavLink>
        </nav>
        <div className="p-3 border-t border-hairline space-y-1">
          <a href="/" className="block px-3 py-2 text-ink-soft hover:bg-ivory rounded-md">
            View store ↗
          </a>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}
            className="w-full text-left px-3 py-2 text-ink-soft hover:bg-ivory rounded-md cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
