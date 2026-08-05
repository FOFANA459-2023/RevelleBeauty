import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminProductDetailDTO } from '@contracts/index';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/cn';

const MAX_BYTES = 5 * 1024 * 1024;

/** Upload with XHR progress; client-side gate before bytes leave. */
export function ImagePanel({ product }: { product: AdminProductDetailDTO }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.admin.product(product.id) });

  const upload = async (files: FileList | File[]) => {
    setError(null);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name}: not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: over 5 MB`);
        continue;
      }
      try {
        const bmp = await createImageBitmap(file);
        const { width } = bmp;
        bmp.close();
        if (width < 600) {
          setError(`${file.name}: only ${width}px wide — please upload at least 1000px for product photography`);
          if (width < 400) continue;
        }
      } catch {
        // Bitmap probe failed (some formats) — let the server sniff it.
      }
      try {
        setProgress(0);
        await api.adminUploadImage(product.id, file, {}, (f) => setProgress(f));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setProgress(null);
      }
    }
    await refresh();
  };

  return (
    <section className="mt-6 bg-porcelain border border-hairline rounded-md p-6">
      <h2 className="text-[15px] font-semibold text-ink mb-4">
        Photos <span className="text-ink-muted font-normal">({product.images.length})</span>
      </h2>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void upload(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors',
          dragOver ? 'border-gold-700 bg-ivory' : 'border-hairline hover:border-gold-500',
        )}
      >
        <p className="text-[13px] text-ink-soft">
          Drop photos here or <span className="underline">browse</span>
        </p>
        <p className="text-[12px] text-ink-muted mt-1">JPEG/PNG/WebP up to 5 MB · at least 1000px wide</p>
        {progress !== null && (
          <div className="mt-4 h-1.5 bg-ivory-deep rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-gold-700 transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && void upload(e.target.files)}
      />
      {error && <p className="mt-3 text-[13px] text-ink font-medium">✕ {error}</p>}

      {product.images.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {product.images.map((img) => (
            <li key={img.id} className="border border-hairline rounded-md overflow-hidden bg-ivory/40">
              <div className="aspect-square bg-ivory-deep grid place-items-center overflow-hidden">
                <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-contain" />
              </div>
              <div className="p-2.5 space-y-2">
                <select
                  aria-label="Link to shade"
                  className="w-full bg-porcelain border border-hairline rounded px-2 py-1 text-[12px]"
                  value={img.variantId ?? ''}
                  onChange={async (e) => {
                    await api.adminPatchImage(img.id, { variantId: e.target.value || null });
                    await refresh();
                  }}
                >
                  <option value="">All shades</option>
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <div className="flex items-center justify-between">
                  {img.isPrimary ? (
                    <span className="text-[11px] uppercase tracking-wide text-gold-950">★ Primary</span>
                  ) : (
                    <button
                      className="text-[12px] text-ink-muted hover:text-ink cursor-pointer"
                      onClick={async () => {
                        await api.adminPatchImage(img.id, { isPrimary: true });
                        await refresh();
                      }}
                    >
                      ☆ Set primary
                    </button>
                  )}
                  <button
                    className="text-[12px] text-ink-muted hover:text-ink cursor-pointer"
                    onClick={async () => {
                      if (!window.confirm('Delete this photo?')) return;
                      await api.adminDeleteImage(img.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
