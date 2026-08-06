import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminOrders, useAdminOrder } from '@/features/admin/useAdmin';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { FulfillmentStage, OrderStatus } from '@contracts/index';

const PIPELINE: { stage: FulfillmentStage; label: string }[] = [
  { stage: 'payment_received', label: 'Payment received' },
  { stage: 'packaged', label: 'Packaged' },
  { stage: 'shipped', label: 'Shipped' },
  { stage: 'delivered', label: 'Delivered' },
];

const STATUS_BADGE: Record<string, string> = {
  paid: 'border-gold-500 text-ink bg-ivory',
  fulfilled: 'border-hairline text-ink-soft bg-porcelain',
  pending: 'border-hairline text-ink-muted bg-ivory-deep',
  needs_review: 'border-gold-700 text-ink bg-gold-50 font-semibold',
  cancelled: 'border-hairline text-ink-muted line-through',
  refunded: 'border-hairline text-ink-muted',
  expired: 'border-hairline text-ink-muted',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded border text-[11px] uppercase tracking-wide', STATUS_BADGE[status] ?? 'border-hairline')}>
      {status.replace('_', ' ')}
    </span>
  );
}

export function AdminOrderListPage() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const { data, isPending } = useAdminOrders({ status: status || undefined, q: q || undefined });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Orders</h1>
        <a
          href="/api/admin/orders-export.csv"
          className="text-[13px] text-ink-soft border border-hairline rounded-md px-3 py-1.5 hover:bg-porcelain"
        >
          Export CSV
        </a>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search order #, email, name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 max-w-xs bg-porcelain border border-hairline rounded-md px-3.5 py-2 text-[14px]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-porcelain border border-hairline rounded-md px-3 py-2 text-[14px]"
        >
          <option value="">All statuses</option>
          {['paid', 'fulfilled', 'needs_review', 'pending', 'cancelled', 'refunded', 'expired'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="bg-porcelain border border-hairline rounded-md overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Items</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {isPending && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">Loading…</td></tr>
            )}
            {data?.orders.length === 0 && !isPending && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">No orders yet.</td></tr>
            )}
            {data?.orders.map((o) => (
              <tr key={o.id} className="hover:bg-ivory">
                <td className="px-4 py-3">
                  <Link to={`/admin/orders/${o.id}`} className="font-medium text-ink tabular">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{o.customerName ?? o.email ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-right tabular">{o.itemCount}</td>
                <td className="px-4 py-3 text-right tabular">{formatCents(o.totalCents)}</td>
                <td className="px-4 py-3 text-ink-muted tabular">
                  {new Date(o.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const { data: order } = useAdminOrder(id);
  const qc = useQueryClient();
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');

  if (!order) return <p className="text-ink-muted">Loading…</p>;

  const update = async (patch: Parameters<typeof api.adminUpdateOrder>[1]) => {
    await api.adminUpdateOrder(order.id, patch);
    await qc.invalidateQueries({ queryKey: queryKeys.admin.order(order.id) });
    await qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/orders" className="text-ink-muted hover:text-ink text-[13px]">← Orders</Link>
        <h1 className="text-xl font-semibold text-ink tabular">{order.orderNumber}</h1>
        <StatusBadge status={order.status} />
        {order.oversold && (
          <span className="text-[12px] text-ink font-medium">⚠ oversold — check stock</span>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <section className="bg-porcelain border border-hairline rounded-md p-5">
            <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-3">Items</h2>
            <ul className="divide-y divide-hairline">
              {order.items.map((item) => (
                <li key={item.id} className="py-3 flex items-center gap-3">
                  {item.variantHex && (
                    <span
                      className="w-5 h-5 rounded-full border border-hairline shrink-0"
                      style={{ background: item.variantHex }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-ink">{item.productName}</p>
                    {item.variantName !== 'Default' && (
                      <p className="text-[12px] text-ink-muted">{item.variantName}</p>
                    )}
                  </div>
                  <span className="tabular text-ink-soft">×{item.quantity}</span>
                  <span className="tabular text-ink w-20 text-right">{formatCents(item.lineTotalCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 pt-3 border-t border-hairline space-y-1.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="tabular">{formatCents(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd className="tabular">{formatCents(order.shippingCents)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular">{formatCents(order.totalCents)}</dd></div>
            </dl>
          </section>

          <section className="bg-porcelain border border-hairline rounded-md p-5">
            <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Fulfillment pipeline
            </h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {PIPELINE.map((p) => {
                const isCurrent = order.fulfillmentStage === p.stage;
                return (
                  <button
                    key={p.stage}
                    disabled={isCurrent}
                    onClick={() => {
                      void api.adminUpdateStage(order.id, p.stage).then(() => {
                        void qc.invalidateQueries({ queryKey: queryKeys.admin.order(order.id) });
                        void qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
                      });
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-md border text-[13px] cursor-pointer',
                      isCurrent
                        ? 'metal-surface border-transparent font-medium cursor-default'
                        : 'border-hairline text-ink-soft hover:bg-ivory',
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* timeline incl. customer delivery confirmations */}
            {order.events.length > 0 && (
              <ul className="mb-5 border-l border-hairline ml-1 space-y-0">
                {[...order.events].reverse().map((e) => (
                  <li key={e.id} className="relative pl-5 pb-3 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[4px] top-1.5 w-2 h-2 rounded-full bg-gold-500"
                    />
                    <p className="text-[13px] text-ink">
                      {e.note ?? e.stage?.replace(/_/g, ' ')}
                      <span
                        className={cn(
                          'ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border',
                          e.actor === 'customer'
                            ? 'border-gold-700 text-gold-950 font-semibold'
                            : 'border-hairline text-ink-muted',
                        )}
                      >
                        {e.actor}
                      </span>
                    </p>
                    <p className="text-[11px] text-ink-muted tabular">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-3">Order status</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['paid', 'fulfilled', 'cancelled', 'refunded'] as OrderStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={order.status === s}
                  onClick={() => void update({ status: s })}
                  className={cn(
                    'px-3 py-1.5 rounded-md border text-[13px] cursor-pointer',
                    order.status === s
                      ? 'border-gold-700 text-ink bg-ivory cursor-default'
                      : 'border-hairline text-ink-soft hover:bg-ivory',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                placeholder={order.trackingNumber ?? 'Tracking number'}
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                className="flex-1 bg-ivory border border-hairline rounded-md px-3 py-2 text-[13px]"
              />
              <button
                onClick={() => tracking && void update({ trackingNumber: tracking })}
                className="border border-hairline rounded-md px-3 py-2 text-[13px] text-ink-soft hover:bg-ivory cursor-pointer"
              >
                Save
              </button>
            </div>
            <textarea
              placeholder={order.adminNotes ?? 'Internal notes…'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes && void update({ adminNotes: notes })}
              rows={2}
              className="mt-3 w-full bg-ivory border border-hairline rounded-md px-3 py-2 text-[13px]"
            />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="bg-porcelain border border-hairline rounded-md p-5">
            <h2 className="text-[13px] font-semibold text-ink-muted uppercase tracking-wide mb-3">Customer</h2>
            <p className="text-ink">{order.customerName ?? '—'}</p>
            <p className="text-[13px] text-ink-soft break-all">{order.email ?? '—'}</p>
            {order.phone && <p className="text-[13px] text-ink-soft">{order.phone}</p>}
            {order.shippingLine1 && (
              <address className="mt-3 not-italic text-[13px] text-ink-soft leading-relaxed">
                {order.shippingName}<br />
                {order.shippingLine1}<br />
                {order.shippingLine2 && <>{order.shippingLine2}<br /></>}
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}<br />
                {order.shippingCountry}
              </address>
            )}
          </section>
          <section className="bg-porcelain border border-hairline rounded-md p-5 text-[12px] text-ink-muted space-y-1">
            <p>Placed {new Date(order.createdAt).toLocaleString()}</p>
            {order.paidAt && <p>Paid {new Date(order.paidAt).toLocaleString()}</p>}
            {order.fulfilledAt && <p>Fulfilled {new Date(order.fulfilledAt).toLocaleString()}</p>}
            {order.stripePaymentIntentId && (
              <p className="break-all">PI: {order.stripePaymentIntentId}</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
