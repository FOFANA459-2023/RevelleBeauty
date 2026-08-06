import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminProductDetailDTO, AdminVariantDTO, ImageDTO } from '@contracts/index';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { normalizeHex, isPaleShade, describeShadeColor } from '@/lib/shade';
import { Button } from '@/components/ui/Button';

/**
 * The shade rows. Built for a non-technical merchandiser: the color is shown
 * as a live swatch AND a plain-English name (never a bare hex), and each
 * shade carries its own photo — the storefront swaps to it when a shopper
 * clicks that shade.
 */
export function ShadeVariantEditor({ product }: { product: AdminProductDetailDTO }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.admin.product(product.id) });

  const addVariant = async () => {
    setBusy(true);
    try {
      await api.adminCreateVariant(product.id, {
        name: `New shade ${product.variants.length + 1}`,
        hexColor: '#d9738a',
        stockQuantity: 0,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 bg-porcelain border border-hairline rounded-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-ink">
          {product.variantLabel}s <span className="text-ink-muted font-normal">({product.variants.length})</span>
        </h2>
        <Button variant="outline" size="sm" loading={busy} onClick={addVariant}>
          + Add {product.variantLabel.toLowerCase()}
        </Button>
      </div>
      <div className="space-y-3">
        {product.variants.map((v) => (
          <VariantRow key={v.id} product={product} variant={v} onChanged={refresh} />
        ))}
      </div>
    </section>
  );
}

function VariantRow({
  product,
  variant,
  onChanged,
}: {
  product: AdminProductDetailDTO;
  variant: AdminVariantDTO;
  onChanged: () => void;
}) {
  const [name, setName] = useState(variant.name);
  const [hexText, setHexText] = useState(variant.hexColor ?? '');
  const [stock, setStock] = useState(String(variant.stockQuantity));
  const [saving, setSaving] = useState(false);

  const hex = variant.hexColor;
  const pale = hex ? isPaleShade(hex) : false;
  // Live name: follows what's being typed as soon as it's a real color.
  const colorName = describeShadeColor(normalizeHex(hexText) ?? hex ?? '');

  const patch = async (p: Parameters<typeof api.adminUpdateVariant>[1]) => {
    setSaving(true);
    try {
      await api.adminUpdateVariant(variant.id, p);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const commitHex = async (raw: string) => {
    if (!raw.trim()) {
      await patch({ hexColor: null });
      return;
    }
    const normalized = normalizeHex(raw);
    if (normalized) {
      setHexText(normalized);
      await patch({ hexColor: normalized });
    } else {
      setHexText(variant.hexColor ?? '');
    }
  };

  const commitStock = async (raw: string) => {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0 && n !== variant.stockQuantity) {
      await api.adminUpdateStock(variant.id, { stockQuantity: n });
      onChanged();
    } else {
      setStock(String(variant.stockQuantity));
    }
  };

  const removeVariant = async () => {
    const verb = variant.hasOrders ? 'Archive' : 'Delete';
    if (!window.confirm(`${verb} shade "${variant.name}"?`)) return;
    await api.adminDeleteVariant(variant.id);
    onChanged();
  };

  const input = 'bg-ivory border border-hairline rounded-md px-2.5 py-1.5 text-[13px] text-ink';

  return (
    <div className="border border-hairline rounded-md p-3 bg-ivory/40">
      <div className="flex flex-wrap items-center gap-3">
        {/* live dome + hidden native picker on top — click the circle to pick */}
        <span className="relative inline-block shrink-0" title="Click to change the color">
          {hex ? (
            <span
              className="shade-swatch"
              style={{ '--shade': hex, inlineSize: 44, blockSize: 44, ...(variant.hexColorSecondary ? { '--shade-2': variant.hexColorSecondary } : {}) } as CSSProperties}
              data-duo={variant.hexColorSecondary ? '' : undefined}
            />
          ) : (
            <span className="inline-block w-11 h-11 rounded-full border border-dashed border-hairline bg-porcelain" />
          )}
          <input
            type="color"
            aria-label={`Pick color for ${variant.name}`}
            value={hex ?? '#cccccc'}
            onChange={(e) => {
              setHexText(e.target.value);
            }}
            onBlur={(e) => void commitHex(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </span>

        <div>
          <input
            aria-label="Shade name"
            className={`${input} w-36`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== variant.name && void patch({ name: name.trim() })}
          />
          <p className="mt-1 text-[11px] text-ink-muted pl-0.5">Shade name</p>
        </div>

        <div>
          <input
            aria-label="Color code"
            placeholder="#rrggbb"
            className={`${input} w-24 tabular`}
            value={hexText}
            onChange={(e) => setHexText(e.target.value)}
            onBlur={(e) => void commitHex(e.target.value)}
          />
          {/* plain-English translation of the code, for non-technical eyes */}
          <p className="mt-1 text-[11px] text-ink-muted pl-0.5">
            {colorName ? <>Color: <span className="text-ink-soft font-medium">{colorName}</span></> : 'Color code'}
          </p>
        </div>

        <ShadePhoto product={product} variant={variant} onChanged={onChanged} />

        <span className="flex-1" />
        {pale && (
          <span className="text-[11px] text-ink-muted" title="Very light shades render with a darker outline for visibility.">
            pale — auto-outlined
          </span>
        )}
        {saving && <span className="text-[11px] text-ink-muted">saving…</span>}
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-hairline/60 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 text-[12px] text-ink-muted">
          Stock
          <input
            aria-label="Stock"
            inputMode="numeric"
            className={`${input} w-16 tabular`}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={(e) => void commitStock(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-[12px] text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={variant.isAvailable}
            onChange={(e) => void patch({ isAvailable: e.target.checked })}
          />
          Available
        </label>
        {variant.isDefault ? (
          <span className="text-[11px] uppercase tracking-wide text-gold-950 border border-gold-500 rounded px-1.5 py-0.5">
            Default
          </span>
        ) : (
          <button
            onClick={() => void patch({ isDefault: true })}
            className="text-[12px] text-ink-muted hover:text-ink cursor-pointer"
          >
            Make default
          </button>
        )}
        <span className="flex-1" />
        <button
          onClick={removeVariant}
          className="text-[12px] text-ink-muted hover:text-ink cursor-pointer"
        >
          {variant.hasOrders ? 'Archive' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

/**
 * Per-shade photo. Shoppers see this image the moment they click the shade
 * on the product page. "Change" replaces the previous shade photo in one
 * step (the old one is removed unless it doubles as the primary photo).
 */
function ShadePhoto({
  product,
  variant,
  onChanged,
}: {
  product: AdminProductDetailDTO;
  variant: AdminVariantDTO;
  onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const linked: ImageDTO | undefined = product.images.find((i) => i.variantId === variant.id);

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Not an image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Over 5 MB');
      return;
    }
    try {
      setProgress(0);
      await api.adminUploadImage(
        product.id,
        file,
        { variantId: variant.id, altText: `${product.name} — ${variant.name}` },
        (f) => setProgress(f),
      );
      // One photo per shade: retire the previous one. If it also serves as
      // the product's primary photo, keep it but detach it from this shade.
      if (linked) {
        if (linked.isPrimary) await api.adminPatchImage(linked.id, { variantId: null });
        else await api.adminDeleteImage(linked.id);
      }
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        title={linked ? 'Change this shade’s photo' : 'Add a photo for this shade'}
        className="w-11 h-11 shrink-0 rounded-md border border-hairline bg-ivory-deep overflow-hidden grid place-items-center cursor-pointer hover:border-gold-500 transition-colors"
      >
        {progress !== null ? (
          <span className="text-[10px] tabular text-ink-muted">{Math.round(progress * 100)}%</span>
        ) : linked ? (
          <img src={linked.url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg text-ink-muted leading-none" aria-hidden="true">+</span>
        )}
      </button>
      <div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-[12px] text-ink-soft hover:text-ink underline cursor-pointer"
        >
          {linked ? 'Change photo' : 'Add photo'}
        </button>
        <p className="text-[11px] text-ink-muted">
          {error ? <span className="text-ink font-medium">✕ {error}</span> : 'Shown when clicked'}
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
