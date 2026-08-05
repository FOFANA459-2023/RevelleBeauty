import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminProductDetailDTO, AdminVariantDTO } from '@contracts/index';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { normalizeHex, isPaleShade } from '@/lib/shade';
import { Button } from '@/components/ui/Button';

/**
 * The shade rows. HexColorField overlays a transparent native color input on
 * the live gloss dome, paired with a text input (merchandisers paste hexes
 * from supplier sheets). The preview IS the real .shade-swatch recipe.
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
          <VariantRow key={v.id} variant={v} onChanged={refresh} />
        ))}
      </div>
    </section>
  );
}

function VariantRow({ variant, onChanged }: { variant: AdminVariantDTO; onChanged: () => void }) {
  const [name, setName] = useState(variant.name);
  const [hexText, setHexText] = useState(variant.hexColor ?? '');
  const [stock, setStock] = useState(String(variant.stockQuantity));
  const [saving, setSaving] = useState(false);

  const hex = variant.hexColor;
  const pale = hex ? isPaleShade(hex) : false;

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
    <div className="flex flex-wrap items-center gap-3 border border-hairline rounded-md p-3 bg-ivory/40">
      {/* live dome + hidden native picker on top */}
      <span className="relative inline-block">
        {hex ? (
          <span
            className="shade-swatch"
            style={{ '--shade': hex, inlineSize: 40, blockSize: 40, ...(variant.hexColorSecondary ? { '--shade-2': variant.hexColorSecondary } : {}) } as CSSProperties}
            data-duo={variant.hexColorSecondary ? '' : undefined}
          />
        ) : (
          <span className="inline-block w-10 h-10 rounded-full border border-dashed border-hairline bg-porcelain" />
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

      <input
        aria-label="Shade name"
        className={`${input} w-36`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== variant.name && void patch({ name: name.trim() })}
      />
      <input
        aria-label="Hex color"
        placeholder="#rrggbb"
        className={`${input} w-24 tabular`}
        value={hexText}
        onChange={(e) => setHexText(e.target.value)}
        onBlur={(e) => void commitHex(e.target.value)}
      />
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
      {pale && (
        <span className="text-[11px] text-ink-muted" title="Very light shades render with a darker outline for visibility.">
          pale — auto-outlined
        </span>
      )}
      {saving && <span className="text-[11px] text-ink-muted">saving…</span>}
      <button
        onClick={removeVariant}
        className="text-[12px] text-ink-muted hover:text-ink cursor-pointer"
      >
        {variant.hasOrders ? 'Archive' : 'Delete'}
      </button>
    </div>
  );
}
