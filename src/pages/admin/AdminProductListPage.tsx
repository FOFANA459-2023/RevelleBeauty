import { useState } from 'react';
import { Link } from 'react-router';
import { useAdminProducts, useAdminStats } from '@/features/admin/useAdmin';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/cn';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-ivory text-ink border-gold-500',
  draft: 'bg-ivory-deep text-ink-muted border-hairline',
  archived: 'bg-porcelain text-ink-muted border-hairline line-through',
};

export function AdminProductListPage() {
  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState('');
  const { data, isPending } = useAdminProducts({ status: status || undefined, q: q || undefined });
  const { data: stats } = useAdminStats();

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold text-ink">Products</h1>
        <Link
          to="/admin/products/new"
          className="bg-ink text-porcelain px-4 py-2 rounded-md text-[13px] font-medium hover:bg-ink-soft"
        >
          + New product
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatTile label="Orders today" value={String(stats.ordersToday)} />
          <StatTile label="Revenue (30d)" value={formatCents(stats.revenue30dCents)} />
          <StatTile label="To fulfill" value={String(stats.pendingFulfillment)} />
          <StatTile
            label="Needs review"
            value={String(stats.oversoldCount)}
            alert={stats.oversoldCount > 0}
          />
        </div>
      )}

      {stats && stats.lowStock.length > 0 && (
        <div className="mb-6 bg-porcelain border border-gold-500 rounded-md p-4">
          <p className="text-[13px] font-medium text-ink mb-2">Low stock</p>
          <ul className="text-[13px] text-ink-soft space-y-1">
            {stats.lowStock.map((l) => (
              <li key={l.variantId} className="tabular">
                {l.productName} — {l.variantName}: <strong>{l.stock}</strong> left
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <input
          placeholder="Search products…"
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
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-porcelain border border-hairline rounded-md overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-left text-ink-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Shades</th>
              <th className="px-4 py-3 font-medium text-right">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {isPending && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-muted">Loading…</td></tr>
            )}
            {data?.products.map((p) => (
              <tr key={p.id} className="hover:bg-ivory">
                <td className="px-4 py-3">
                  <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 text-ink font-medium">
                    {p.primaryImageUrl ? (
                      <img src={p.primaryImageUrl} alt="" className="w-9 h-9 object-contain bg-ivory-deep rounded" />
                    ) : (
                      <span className="w-9 h-9 grid place-items-center bg-ivory-deep rounded text-gold-500 text-xs font-serif">RB</span>
                    )}
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.categoryName}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-block px-2 py-0.5 rounded border text-[11px] uppercase tracking-wide', STATUS_STYLES[p.status])}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular">{formatCents(p.basePriceCents)}</td>
                <td className="px-4 py-3 text-right tabular">{p.variantCount}</td>
                <td className={cn('px-4 py-3 text-right tabular', p.totalStock <= 5 && 'text-ink font-semibold')}>
                  {p.totalStock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatTile({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={cn('bg-porcelain border rounded-md p-4', alert ? 'border-gold-700' : 'border-hairline')}>
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular text-ink">{value}</p>
    </div>
  );
}
