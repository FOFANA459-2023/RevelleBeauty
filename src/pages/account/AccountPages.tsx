import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useLocation, useNavigate, useParams } from 'react-router';
import {
  useAccountOrder,
  useAccountOrders,
  useConfirmDelivery,
  useCustomer,
  useCustomerLogout,
  useMarkMessagesRead,
  useMessages,
  useUpdateProfile,
} from '@/features/auth/useCustomer';
import { TrackingTimeline } from '@/components/account/TrackingTimeline';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { Button } from '@/components/ui/Button';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { FulfillmentStage } from '@contracts/index';

const inputCls =
  'mt-1.5 w-full bg-porcelain border border-hairline rounded-xs px-4 py-3 text-sm text-ink';
const labelText = 'eyebrow text-ink-muted';

const STAGE_LABEL: Record<FulfillmentStage, string> = {
  awaiting_payment: 'Awaiting payment',
  payment_received: 'Payment received',
  packaged: 'Packaged',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

/* ================= shared shell: guard + header + tab nav =================
   Each area (account, addresses, orders, messages) is its own page; the
   shell keeps navigation between them one tap away. All data lives on the
   server, so everything here survives logout and follows the customer
   across devices. */

function AccountShell({ children }: { children: React.ReactNode }) {
  const { data: me, isPending, isError } = useCustomer();
  const { data: inbox } = useMessages(Boolean(me));
  const logout = useCustomerLogout();
  const navigate = useNavigate();
  const location = useLocation();

  if (isPending) return <div className="py-32 text-center text-sm text-ink-muted">Loading…</div>;
  if (isError || !me) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const tabs = [
    { to: '/account', label: 'My account', end: true },
    { to: '/account/addresses', label: 'Addresses', end: false },
    { to: '/account/orders', label: 'Orders', end: false },
    { to: '/account/messages', label: 'Messages', end: false, badge: inbox?.unreadCount ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-gutter py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow text-gold-950">My account</p>
          <h1 className="display text-display-2 text-ink mt-3">{me.name.split(' ')[0]}</h1>
          <p className="mt-2 text-sm text-ink-muted">{me.email}</p>
        </div>
        <div className="flex items-center gap-5">
          {me.role === 'admin' && (
            <Link to="/admin" className="text-sm text-gold-950 link-ink">
              Admin dashboard →
            </Link>
          )}
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}
            className="text-sm text-ink-muted link-ink cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      <nav aria-label="Account" className="mt-8 border-b border-hairline flex gap-6 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'relative eyebrow pb-3 whitespace-nowrap transition-colors border-b-2 -mb-px',
                isActive
                  ? 'text-ink border-gold-700'
                  : 'text-ink-muted border-transparent hover:text-ink',
              )
            }
          >
            {t.label}
            {Boolean(t.badge) && (
              <span className="ml-1.5 inline-grid place-items-center min-w-4 h-4 px-1 rounded-full bg-gold-700 text-porcelain text-[0.6rem] tabular align-middle">
                {t.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-10">{children}</div>
    </div>
  );
}

/* ================= /account — profile ================= */

export function AccountPage() {
  const { data: me } = useCustomer();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (me) setForm({ name: me.name, phone: me.phone ?? '' });
  }, [me]);

  return (
    <AccountShell>
      {me && (
        <section className="bg-porcelain border border-hairline rounded-sm p-6 max-w-md">
          <div className="flex items-center justify-between mb-5">
            <h2 className="eyebrow text-ink">Profile</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-ink-muted link-ink cursor-pointer">
                Edit
              </button>
            )}
          </div>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate(
                  { name: form.name, phone: form.phone || null },
                  { onSuccess: () => setEditing(false) },
                );
              }}
              className="space-y-4"
            >
              <label className="block">
                <span className={labelText}>Name</span>
                <input value={form.name} required
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelText}>Phone</span>
                <input value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </label>
              <div className="flex gap-3 pt-1">
                <Button variant="metal" size="sm" type="submit" loading={updateProfile.isPending}>Save</Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className={labelText}>Name</dt>
                <dd className="mt-1 text-ink">{me.name}</dd>
              </div>
              <div>
                <dt className={labelText}>Phone</dt>
                <dd className="mt-1 text-ink">{me.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className={labelText}>Email</dt>
                <dd className="mt-1 text-ink">{me.email}</dd>
              </div>
            </dl>
          )}
        </section>
      )}
    </AccountShell>
  );
}

/* ================= /account/addresses ================= */

export function AccountAddressesPage() {
  const { data: me } = useCustomer();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ line1: '', line2: '', city: '', state: '', postalCode: '' });

  useEffect(() => {
    if (me) {
      setForm({
        line1: me.address?.line1 ?? '',
        line2: me.address?.line2 ?? '',
        city: me.address?.city ?? '',
        state: me.address?.state ?? '',
        postalCode: me.address?.postalCode ?? '',
      });
    }
  }, [me]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        address: form.line1
          ? {
              line1: form.line1,
              line2: form.line2 || null,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode,
              country: me?.address?.country ?? 'US',
            }
          : null,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <AccountShell>
      <section className="bg-porcelain border border-hairline rounded-sm p-6 max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="eyebrow text-ink">Default shipping address</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-ink-muted link-ink cursor-pointer">
              {me?.address ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            {([
              ['line1', 'Address'], ['line2', 'Apt / suite (optional)'],
              ['city', 'City'], ['state', 'State'], ['postalCode', 'ZIP / Postal code'],
            ] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className={labelText}>{label}</span>
                <input value={form[key]} required={key !== 'line2'}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
              </label>
            ))}
            <div className="flex gap-3 pt-1">
              <Button variant="metal" size="sm" type="submit" loading={updateProfile.isPending}>Save</Button>
              <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : me?.address ? (
          <p className="text-sm text-ink-soft leading-relaxed">
            {me.address.line1}{me.address.line2 && <><br />{me.address.line2}</>}<br />
            {me.address.city}, {me.address.state} {me.address.postalCode}
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            No saved address yet. Add one here — or it will be saved automatically
            the first time you order — and checkout will fill itself in from then on.
          </p>
        )}
      </section>
    </AccountShell>
  );
}

/* ================= /account/orders — history ================= */

export function AccountOrdersPage() {
  const { data: orders } = useAccountOrders();

  return (
    <AccountShell>
      {!orders || orders.length === 0 ? (
        <div className="text-center py-16 bg-porcelain border border-hairline rounded-sm">
          <Sparkle size={22} className="text-gold-300" />
          <p className="mt-4 font-display text-h3 text-ink">No orders yet.</p>
          <Link to="/shop" className="mt-3 inline-block text-sm text-ink link-ink">
            Discover the collection
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                to={`/account/orders/${o.id}`}
                className="flex items-center gap-4 bg-porcelain border border-hairline rounded-sm p-5 hover:border-gold-500 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-medium tabular">{o.orderNumber}</p>
                  <p className="text-xs text-ink-muted mt-0.5 tabular">
                    {new Date(o.placedAt).toLocaleDateString()} · {o.itemCount}{' '}
                    {o.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <span
                  className={cn(
                    'eyebrow text-[0.56rem] px-2.5 py-1.5 rounded-xs border',
                    o.fulfillmentStage === 'delivered'
                      ? 'border-hairline text-ink-muted'
                      : 'border-gold-500 text-gold-950 bg-ivory',
                  )}
                >
                  {STAGE_LABEL[o.fulfillmentStage]}
                </span>
                <span className="tabular text-ink">{formatCents(o.totalCents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}

/* ================= /account/messages — the inbox ================= */

export function AccountMessagesPage() {
  const { data: me } = useCustomer();
  const { data: inbox } = useMessages(Boolean(me));
  const markRead = useMarkMessagesRead();

  // Opening the inbox clears the unread state — everywhere, on every device.
  useEffect(() => {
    if (inbox && inbox.unreadCount > 0 && !markRead.isPending) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbox?.unreadCount]);

  return (
    <AccountShell>
      {!inbox || inbox.messages.length === 0 ? (
        <div className="text-center py-16 bg-porcelain border border-hairline rounded-sm">
          <Sparkle size={22} className="text-gold-300" />
          <p className="mt-4 font-display text-h3 text-ink">No messages yet.</p>
          <p className="mt-2 text-sm text-ink-muted">
            Order confirmations and tracking updates will land here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {inbox.messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                'bg-porcelain border rounded-sm p-5',
                m.readAt ? 'border-hairline' : 'border-gold-500',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  {!m.readAt && (
                    <span className="w-2 h-2 rounded-full bg-gold-700 shrink-0" aria-label="Unread" />
                  )}
                  <p className="text-sm font-medium text-ink truncate">{m.title}</p>
                </div>
                <p className="text-xs text-ink-muted tabular shrink-0">
                  {new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{m.body}</p>
              {m.orderId && (
                <Link
                  to={`/account/orders/${m.orderId}`}
                  className="mt-3 inline-block text-xs text-ink link-ink"
                >
                  View order & tracking →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}

/* ================= /account/orders/:id — tracking ================= */

export function AccountOrderPage() {
  const { id } = useParams();
  const { data: me, isPending: authPending, isError: authError } = useCustomer();
  const { data: order, isPending } = useAccountOrder(id);
  const confirm = useConfirmDelivery();

  if (authPending) return <div className="py-32 text-center text-sm text-ink-muted">Loading…</div>;
  if (authError || !me) return <Navigate to="/login" replace />;
  if (isPending) return <div className="py-32 text-center text-sm text-ink-muted">Loading order…</div>;
  if (!order) return <Navigate to="/account/orders" replace />;

  return (
    <div className="mx-auto max-w-3xl px-gutter py-12">
      <Link to="/account/orders" className="eyebrow text-ink-muted link-ink">← My orders</Link>
      <div className="mt-6 flex items-end justify-between flex-wrap gap-3">
        <h1 className="display text-h1 text-ink tabular">{order.orderNumber}</h1>
        <p className="text-sm text-ink-muted tabular">
          Placed {new Date(order.placedAt).toLocaleDateString()}
        </p>
      </div>

      {/* tracking */}
      <section className="mt-10 bg-porcelain border border-hairline rounded-sm p-6 sm:p-8">
        <h2 className="eyebrow text-ink mb-8">Tracking</h2>
        <TrackingTimeline stage={order.fulfillmentStage} events={order.events} />

        {order.trackingNumber && (
          <p className="mt-6 text-sm text-ink-soft">
            Tracking number:{' '}
            {order.trackingUrl ? (
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="link-ink text-ink tabular">
                {order.trackingNumber}
              </a>
            ) : (
              <span className="tabular text-ink">{order.trackingNumber}</span>
            )}
          </p>
        )}

        {order.fulfillmentStage === 'shipped' && (
          <div className="mt-8 border-t border-hairline pt-6 text-center">
            <p className="text-sm text-ink-soft">Package arrived?</p>
            <Button
              variant="metal"
              className="mt-4"
              loading={confirm.isPending}
              onClick={() => confirm.mutate(order.id)}
            >
              <Sparkle size={11} /> Confirm delivery
            </Button>
            <p className="mt-3 text-xs text-ink-muted">
              This lets us know your order made it home safely.
            </p>
          </div>
        )}
        {order.fulfillmentStage === 'delivered' && (
          <p className="mt-8 border-t border-hairline pt-6 text-center shade-name text-h3 text-ink">
            Delivered. Enjoy your shades.
          </p>
        )}
      </section>

      {/* items */}
      <section className="mt-6 bg-porcelain border border-hairline rounded-sm p-6 sm:p-8">
        <h2 className="eyebrow text-ink mb-4">Items</h2>
        <ul className="divide-y divide-hairline">
          {order.items.map((item, i) => (
            <li key={i} className="py-4 flex items-center gap-4">
              {item.variantHex && (
                <span
                  className="w-6 h-6 rounded-full shrink-0 border border-hairline"
                  style={{ background: item.variantHex }}
                  aria-hidden="true"
                />
              )}
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.productSlug}`} className="text-sm text-ink hover:text-ink-soft">
                  {item.productName}
                </Link>
                {item.variantName !== 'Default' && (
                  <p className="shade-name text-sm text-ink-soft">{item.variantName}</p>
                )}
              </div>
              <span className="text-xs text-ink-muted tabular">×{item.quantity}</span>
              <span className="text-sm tabular text-ink">{formatCents(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <GoldRule className="my-4" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="tabular">{formatCents(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-muted">Shipping</dt>
            <dd className="tabular">
              {order.shippingCents === 0 ? 'Complimentary' : formatCents(order.shippingCents)}
            </dd>
          </div>
          <div className="flex justify-between text-base pt-1">
            <dt className="eyebrow text-ink">Total</dt>
            <dd className="tabular text-ink">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
        {order.shipping && (
          <>
            <GoldRule className="my-4" />
            <p className="eyebrow text-ink-muted mb-2">Shipped to</p>
            <p className="text-sm text-ink-soft leading-relaxed">
              {order.shipping.name}<br />
              {order.shipping.line1}{order.shipping.line2 && <><br />{order.shipping.line2}</>}<br />
              {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
