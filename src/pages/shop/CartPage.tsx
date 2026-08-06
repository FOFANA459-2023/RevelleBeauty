import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart, selectSubtotalCents } from '@/features/cart/cartStore';
import { useSettings } from '@/features/catalog/useCatalog';
import { validateCart } from '@/lib/api';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { formatCents } from '@/lib/money';

export function CartPage() {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const applyValidation = useCart((s) => s.applyValidation);
  const subtotal = useCart(selectSubtotalCents);
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeThreshold = settings?.freeShippingThresholdCents;
  const shippingCents =
    freeThreshold != null && subtotal >= freeThreshold ? 0 : settings?.flatShippingCents ?? 0;

  // Checkout is login-gated and collects shipping on its own page.
  const checkout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await validateCart(
        lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      );
      applyValidation(r.lines, r.removed);
      if (r.removed.length > 0) {
        setError('Some items are no longer available and were removed — please review your bag.');
        setSubmitting(false);
        return;
      }
      navigate('/checkout');
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="py-32 text-center px-gutter">
        <Sparkle size={28} className="text-gold-300" />
        <h1 className="mt-6 font-display text-h1 text-ink">Your bag is empty.</h1>
        <p className="mt-3 text-body text-ink-muted">The shades are waiting.</p>
        <Button variant="metal" className="mt-10" onClick={() => navigate('/shop')}>
          Shop the collection
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-gutter py-12">
      <h1 className="display text-display-2 text-ink">Your bag</h1>
      <GoldRule className="mt-6 mb-2" />

      <div className="grid lg:grid-cols-[1fr_340px] gap-12 mt-8">
        <ul className="divide-y divide-hairline">
          {lines.map((line) => (
            <li key={line.variantId} className="py-6 flex gap-5">
              <Link
                to={`/product/${line.productSlug}`}
                className="w-24 h-30 sm:w-28 sm:h-36 bg-ivory-deep rounded-xs shrink-0 grid place-items-center overflow-hidden"
              >
                {line.imageUrl ? (
                  <img src={line.imageUrl} alt="" className="h-full w-full object-contain" />
                ) : line.shadeHex ? (
                  <ShadeSwatch hex={line.shadeHex} hexSecondary={line.shadeHexSecondary} name={line.shadeName} size={52} interactive={false} />
                ) : (
                  <span className="font-display text-gold-300 text-2xl">RB</span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/product/${line.productSlug}`} className="font-display text-lg text-ink leading-snug hover:text-ink-soft">
                      {line.productName}
                    </Link>
                    {line.shadeName !== 'Default' && (
                      <p className="mt-1 flex items-center gap-2">
                        {line.shadeHex && (
                          <ShadeSwatch hex={line.shadeHex} hexSecondary={line.shadeHexSecondary} name={line.shadeName} size={16} interactive={false} />
                        )}
                        <span className="shade-name text-base text-ink-soft">{line.shadeName}</span>
                      </p>
                    )}
                  </div>
                  <span className="tabular text-ink">{formatCents(line.unitPriceCents * line.quantity)}</span>
                </div>
                <div className="mt-4 flex items-center gap-6">
                  <QuantityStepper
                    value={line.quantity}
                    max={line.maxQuantity}
                    onChange={(q) => setQuantity(line.variantId, q)}
                  />
                  <button
                    onClick={() => remove(line.variantId)}
                    className="text-xs text-ink-muted link-ink cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 self-start bg-porcelain border border-hairline rounded-sm p-6 space-y-5">
          <h2 className="eyebrow text-ink">Order summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular text-ink">{formatCents(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Shipping</dt>
              <dd className="tabular text-ink">
                {shippingCents === 0 ? 'Complimentary' : formatCents(shippingCents)}
              </dd>
            </div>
          </dl>
          <GoldRule />
          <div className="flex justify-between items-baseline">
            <span className="eyebrow text-ink">Total</span>
            <span className="text-xl tabular text-ink">{formatCents(subtotal + shippingCents)}</span>
          </div>
          {error && <p className="text-xs text-ink-soft border border-hairline bg-ivory rounded-xs p-3">{error}</p>}
          <Button
            variant="metal"
            size="lg"
            className="w-full"
            loading={submitting}
            onClick={checkout}
          >
            Checkout
          </Button>
          <p className="text-xs text-ink-muted text-center">
            Taxes calculated at checkout.
          </p>
        </aside>
      </div>
    </div>
  );
}
