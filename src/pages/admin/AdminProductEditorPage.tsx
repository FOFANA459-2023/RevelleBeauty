import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminProductDetailDTO, AdminVariantDTO } from '@contracts/index';
import { useAdminProduct, useAdminCategories } from '@/features/admin/useAdmin';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { ShadeVariantEditor } from './components/ShadeVariantEditor';
import { ImagePanel } from './components/ImagePanel';

interface FormState {
  categoryId: string;
  name: string;
  tagline: string;
  description: string;
  ingredients: string;
  howToUse: string;
  basePriceDollars: string;
  status: 'draft' | 'active' | 'archived';
  variantLabel: string;
  isFeatured: boolean;
  trackInventory: boolean;
}

function toForm(p: AdminProductDetailDTO | undefined): FormState {
  return {
    categoryId: p?.categoryId ?? '',
    name: p?.name ?? '',
    tagline: p?.tagline ?? '',
    description: p?.description ?? '',
    ingredients: p?.ingredients ?? '',
    howToUse: p?.howToUse ?? '',
    basePriceDollars: p ? (p.basePriceCents / 100).toFixed(2) : '',
    status: p?.status ?? 'draft',
    variantLabel: p?.variantLabel ?? 'Shade',
    isFeatured: p?.isFeatured ?? false,
    trackInventory: p?.trackInventory ?? true,
  };
}

export function AdminProductEditorPage() {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: product } = useAdminProduct(isNew ? undefined : id);
  const { data: categories } = useAdminCategories();

  const [form, setForm] = useState<FormState>(() => toForm(undefined));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm(toForm(product));
      setDirty(false);
    }
  }, [product]);

  // Guard against losing edits to a stray close/refresh.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const cents = Math.round(parseFloat(form.basePriceDollars || '0') * 100);
    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      tagline: form.tagline.trim() || null,
      description: form.description || null,
      ingredients: form.ingredients || null,
      howToUse: form.howToUse || null,
      basePriceCents: Number.isFinite(cents) ? cents : 0,
      status: form.status,
      variantLabel: form.variantLabel || 'Shade',
      isFeatured: form.isFeatured,
      trackInventory: form.trackInventory,
    };
    try {
      if (isNew) {
        const created = await api.adminCreateProduct(payload);
        await qc.invalidateQueries({ queryKey: ['admin'] });
        navigate(`/admin/products/${created.id}`, { replace: true });
      } else {
        await api.adminUpdateProduct(id!, payload);
        await qc.invalidateQueries({ queryKey: queryKeys.admin.product(id!) });
        await qc.invalidateQueries({ queryKey: ['admin', 'products'] });
        setDirty(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full bg-porcelain border border-hairline rounded-md px-3.5 py-2.5 text-[14px] text-ink';
  const label = 'block text-[13px] text-ink-soft mb-1.5';

  return (
    <div className="max-w-4xl pb-24">
      <Link to="/admin/products" className="text-ink-muted hover:text-ink text-[13px]">← Products</Link>
      <div className="flex items-center justify-between mb-6 mt-2">
        <h1 className="text-xl font-semibold text-ink">
          {isNew ? 'New product' : product?.name ?? '…'}
        </h1>
        {!isNew && product && (
          <span className="text-[12px] text-ink-muted">/{product.slug}</span>
        )}
      </div>

      <div className="bg-porcelain border border-hairline rounded-md p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={label} htmlFor="p-name">Name</label>
            <input id="p-name" className={input} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="p-cat">Category</label>
            <select id="p-cat" className={input} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">Select…</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? ' ' : ''}{c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="p-price">Base price (USD)</label>
            <input
              id="p-price" className={input} inputMode="decimal" placeholder="24.00"
              value={form.basePriceDollars} onChange={(e) => set('basePriceDollars', e.target.value)}
            />
          </div>
          <div>
            <label className={label} htmlFor="p-status">Status</label>
            <select id="p-status" className={input} value={form.status} onChange={(e) => set('status', e.target.value as FormState['status'])}>
              <option value="draft">Draft — hidden from the store</option>
              <option value="active">Active — visible</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        <div>
          <label className={label} htmlFor="p-tag">Tagline</label>
          <input id="p-tag" className={input} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="p-desc">Description</label>
          <textarea id="p-desc" rows={4} className={input} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className={label} htmlFor="p-ing">Ingredients</label>
            <textarea id="p-ing" rows={3} className={input} value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="p-how">How to wear</label>
            <textarea id="p-how" rows={3} className={input} value={form.howToUse} onChange={(e) => set('howToUse', e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-[13px] text-ink-soft cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
            Featured on home page
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft cursor-pointer">
            <input type="checkbox" checked={form.trackInventory} onChange={(e) => set('trackInventory', e.target.checked)} />
            Track inventory
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-soft">
            Variant label
            <input
              className="w-24 bg-porcelain border border-hairline rounded-md px-2 py-1 text-[13px]"
              value={form.variantLabel}
              onChange={(e) => set('variantLabel', e.target.value)}
            />
          </label>
        </div>
      </div>

      {isNew ? (
        <p className="mt-6 text-[13px] text-ink-muted bg-ivory-deep border border-hairline rounded-md p-4">
          Save the product first — then the shade and photo panels unlock. New
          products start as drafts, so nothing appears on the store until you
          set it active.
        </p>
      ) : (
        product && (
          <>
            <ShadeVariantEditor product={product} />
            <ImagePanel product={product} />
          </>
        )
      )}

      {/* sticky save bar */}
      <div className="fixed bottom-0 left-56 right-0 bg-porcelain border-t border-hairline px-8 py-3 flex items-center justify-between gap-4">
        <span className="text-[13px] text-ink-muted">
          {error ? <span className="text-ink font-medium">✕ {error}</span> : dirty ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <div className="flex gap-3">
          {!isNew && product?.status !== 'active' && (
            <Button
              variant="outline" size="sm"
              onClick={async () => {
                await api.adminUpdateProduct(id!, { status: 'active' });
                qc.invalidateQueries({ queryKey: ['admin'] });
              }}
            >
              Publish
            </Button>
          )}
          <Button variant="metal" size="sm" loading={saving} disabled={!dirty && !isNew} onClick={save}>
            {isNew ? 'Create product' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { AdminVariantDTO };
