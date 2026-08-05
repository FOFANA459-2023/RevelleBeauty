import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAdminSession, useAdminLogout } from '@/features/admin/useAdmin';
import { Wordmark } from '@/components/brand/Wordmark';
import { cn } from '@/lib/cn';

/**
 * Utilitarian admin shell: borrows tokens (colors, Jost, gold focus ring),
 * rejects the couture (no Cormorant body, no metallic chrome, dense rhythm).
 * The client guard is UX only — every /api/admin route enforces auth itself.
 */
export function AdminLayout() {
  const { data, isPending, isError } = useAdminSession();
  const logout = useAdminLogout();
  const navigate = useNavigate();
  const location = useLocation();

  if (isPending) {
    return <div className="min-h-dvh bg-ivory grid place-items-center text-sm text-ink-muted">Loading…</div>;
  }
  if (isError || !data) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-dvh bg-ivory flex text-[14px]">
      <aside className="w-56 shrink-0 bg-porcelain border-r border-hairline flex flex-col">
        <div className="p-5 border-b border-hairline">
          <Wordmark variant="ink" size="sm" />
          <p className="eyebrow text-[0.56rem] text-ink-muted mt-2">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Admin">
          {[
            { to: '/admin/products', label: 'Products' },
            { to: '/admin/orders', label: 'Orders' },
          ].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'block px-3 py-2 rounded-md transition-colors',
                  isActive ? 'bg-ivory-deep text-ink font-medium' : 'text-ink-soft hover:bg-ivory',
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-hairline space-y-1">
          <a href="/" className="block px-3 py-2 text-ink-soft hover:bg-ivory rounded-md">
            View store ↗
          </a>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/admin/login') })}
            className="w-full text-left px-3 py-2 text-ink-soft hover:bg-ivory rounded-md cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
