import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart, selectItemCount, selectSubtotalCents } from '@/features/cart/cartStore';
import { useSettings } from '@/features/catalog/useCatalog';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { Sparkle } from '@/components/brand/Sparkle';
import { formatCents } from '@/lib/money';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lines = useCart((s) => s.lines);
  const itemCount = useCart(selectItemCount);
  const subtotal = useCart(selectSubtotalCents);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const reconciled = useCart((s) => s.reconciled);
  const dismissReconciled = useCart((s) => s.dismissReconciled);
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc closes; focus moves into the drawer; body scroll locks.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const freeThreshold = settings?.freeShippingThresholdCents;
  const remainingForFree = freeThreshold != null ? freeThreshold - subtotal : null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] ${open ? 'visible' : 'invisible delay-500'}`}
      aria-hidden={!open}
    >
      {/* scrim */}
      <button
        aria-label="Close bag"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className={`absolute inset-0 bg-ink/25 backdrop-blur-[2px] transition-opacity duration-500 cursor-pointer ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* sheet */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className={`absolute top-0 right-0 h-full w-full max-w-[420px] bg-porcelain flex flex-col
          transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          boxShadow: 'var(--shadow-sheet)',
          transitionTimingFunction: 'var(--ease-couture)',
        }}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-hairline">
          <span className="eyebrow text-ink">
            Your bag {itemCount > 0 && <span className="tabular">({itemCount})</span>}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink text-xl leading-none cursor-pointer"
          >
            ×
          </button>
        </header>

        {reconciled && (
          <div className="px-6 py-3 border-b border-hairline bg-ivory flex items-center justify-between gap-3">
            <p className="text-xs text-ink-soft">Your bag has been updated with current prices and availability.</p>
            <button onClick={dismissReconciled} className="text-xs text-ink-muted hover:text-ink cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="flex-1 grid place-items-center px-6">
            <div className="text-center">
              <Sparkle size={26} className="text-gold-300" />
              <p className="mt-5 font-display text-h3 text-ink">Your bag is empty.</p>
              <p className="mt-2 text-sm text-ink-muted">The shades are waiting.</p>
              <Button variant="outline" className="mt-8" onClick={() => { onClose(); navigate('/shop'); }}>
                Shop the collection
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 divide-y divide-hairline">
              {lines.map((line) => (
                <li key={line.variantId} className="py-5 flex gap-4">
                  <Link
                    to={`/product/${line.productSlug}`}
                    onClick={onClose}
                    className="w-20 h-24 bg-ivory-deep rounded-xs shrink-0 grid place-items-center overflow-hidden"
                  >
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : line.shadeHex ? (
                      <ShadeSwatch hex={line.shadeHex} hexSecondary={line.shadeHexSecondary} name={line.shadeName} size={40} interactive={false} />
                    ) : (
                      <span className="font-display text-gold-300 text-xl">RB</span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base text-ink leading-snug">{line.productName}</p>
                    {line.shadeName !== 'Default' && (
                      <p className="mt-0.5 flex items-center gap-2">
                        {line.shadeHex && (
                          <ShadeSwatch hex={line.shadeHex} hexSecondary={line.shadeHexSecondary} name={line.shadeName} size={14} interactive={false} />
                        )}
                        <span className="shade-name text-sm text-ink-soft">{line.shadeName}</span>
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <QuantityStepper
                        value={line.quantity}
                        max={line.maxQuantity}
                        onChange={(q) => setQuantity(line.variantId, q)}
                      />
                      <span className="text-sm tabular text-ink">
                        {formatCents(line.unitPriceCents * line.quantity)}
                      </span>
                    </div>
                    <button
                      onClick={() => remove(line.variantId)}
                      className="mt-2 text-xs text-ink-muted hover:text-ink link-ink cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-hairline px-6 py-5 space-y-4">
              {remainingForFree != null && remainingForFree > 0 && (
                <p className="text-xs text-ink-muted text-center">
                  {formatCents(remainingForFree)} away from complimentary shipping
                </p>
              )}
              {remainingForFree != null && remainingForFree <= 0 && (
                <p className="text-xs text-ink-soft text-center flex items-center justify-center gap-1.5">
                  <Sparkle size={10} className="text-gold-500" /> Complimentary shipping unlocked
                </p>
              )}
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-ink-muted">Subtotal</span>
                <span className="text-lg tabular text-ink">{formatCents(subtotal)}</span>
              </div>
              <Button
                variant="metal"
                size="lg"
                className="w-full"
                onClick={() => { onClose(); navigate('/cart'); }}
              >
                Review &amp; checkout
              </Button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
