import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import {
  useAccountOrder,
  useAccountOrders,
  useConfirmDelivery,
  useCustomer,
  useCustomerLogout,
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

/* ================= /account — profile + order history ================= */

export function AccountPage() {
  const { data: me, isPending, isError } = useCustomer();
  const { data: orders } = useAccountOrders();
  const logout = useCustomerLogout();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '',
  });

  useEffect(() => {
    if (me) {
      setForm({
        name: me.name,
        phone: me.phone ?? '',
        line1: me.address?.line1 ?? '',
        line2: me.address?.line2 ?? '',
        city: me.address?.city ?? '',
        state: me.address?.state ?? '',
        postalCode: me.address?.postalCode ?? '',
      });
    }
  }, [me]);

  if (isPending) return <div className="py-32 text-center text-sm text-ink-muted">Loading…</div>;
  if (isError || !me) return <Navigate to="/login?next=/account" replace />;

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        name: form.name,
        phone: form.phone || null,
        address: form.line1
          ? {
              line1: form.line1,
              line2: form.line2 || null,
              city: form.city,
              state: form.state,
              postalCode: form.postalCode,
              country: me.address?.country ?? 'US',
            }
          : null,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-gutter py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow text-gold-950">My account</p>
          <h1 className="display text-display-2 text-ink mt-3">
            {me.name.split(' ')[0]}
          </h1>
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

      <GoldRule className="mt-8 mb-10" />

      <div className="grid lg:grid-cols-[320px_1fr] gap-10">
        {/* profile card */}
        <section className="bg-porcelain border border-hairline rounded-sm p-6 self-start">
          <div className="flex items-center justify-between mb-5">
            <h2 className="eyebrow text-ink">Profile</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-ink-muted link-ink cursor-pointer">
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={saveProfile} className="space-y-4">
              {(
                [
                  ['name', 'Name'], ['phone', 'Phone'], ['line1', 'Address'],
                  ['line2', 'Apt / suite'], ['city', 'City'], ['state', 'State'],
                  ['postalCode', 'ZIP'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block">
                  <span className={labelText}>{label}</span>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </label>
              ))}
              <div className="flex gap-3 pt-1">
                <Button variant="metal" size="sm" type="submit" loading={updateProfile.isPending}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" type="button" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
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
                <dt className={labelText}>Default address</dt>
                <dd className="mt-1 text-ink-soft leading-relaxed">
                  {me.address ? (
                    <>
                      {me.address.line1}{me.address.line2 && <><br />{me.address.line2}</>}<br />
                      {me.address.city}, {me.address.state} {me.address.postalCode}
                    </>
                  ) : (
                    '— add one at checkout —'
                  )}
                </dd>
              </div>
            </dl>
          )}
        </section>

        {/* orders */}
        <section>
          <h2 className="eyebrow text-ink mb-5">Order history</h2>
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
        </section>
      </div>
    </div>
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
  if (!order) return <Navigate to="/account" replace />;

  return (
    <div className="mx-auto max-w-3xl px-gutter py-12">
      <Link to="/account" className="eyebrow text-ink-muted link-ink">← My account</Link>
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
