import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useCustomer } from '@/features/auth/useCustomer';
import { useCart, selectSubtotalCents } from '@/features/cart/cartStore';
import { useSettings } from '@/features/catalog/useCatalog';
import { createCheckoutSession, placePreorder } from '@/lib/api';
import { ApiError } from '@/lib/http';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/brand/GoldRule';
import { formatCents } from '@/lib/money';

const inputCls =
  'mt-1.5 w-full bg-porcelain border border-hairline rounded-xs px-4 py-3 text-sm text-ink';
const labelText = 'eyebrow text-ink-muted';

const NOTE_MAX = 500;

/**
 * Login-gated checkout: email from the session, address collected here.
 *
 * Two modes, chosen by the server: 'payment' hands off to Stripe; 'preorder'
 * places the order on the spot with nothing charged, and the store follows
 * up on WhatsApp or email to arrange payment and delivery.
 */
export function CheckoutPage() {
  const { data: me, isPending: authPending, isError: authError } = useCustomer();
  const lines = useCart((s) => s.lines);
  const subtotal = useCart(selectSubtotalCents);
  const { data: settings } = useSettings();

  const [form, setForm] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US',
  });
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [note, setNote] = useState('');
  const navigate = useNavigate();
  const preorder = settings?.checkoutMode === 'preorder';
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from profile once loaded.
  useEffect(() => {
    if (!me) return;
    setForm((f) => ({
      ...f,
      name: f.name || me.name,
      phone: f.phone || (me.phone ?? ''),
      line1: f.line1 || (me.address?.line1 ?? ''),
      line2: f.line2 || (me.address?.line2 ?? ''),
      city: f.city || (me.address?.city ?? ''),
      state: f.state || (me.address?.state ?? ''),
      postalCode: f.postalCode || (me.address?.postalCode ?? ''),
      country: me.address?.country ?? 'US',
    }));
  }, [me]);

  if (authPending) {
    return <div className="py-32 text-center text-sm text-ink-muted">Loading…</div>;
  }
  if (authError || !me) {
    return <Navigate to="/login?next=/checkout" replace />;
  }
  if (lines.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const freeThreshold = settings?.freeShippingThresholdCents;
  const shippingCents =
    freeThreshold != null && subtotal >= freeThreshold ? 0 : settings?.flatShippingCents ?? 0;

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (preorder) {
        const placed = await placePreorder({
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          shipping: { ...form, line2: form.line2 || null },
          saveAsDefault,
          note: note.trim() || null,
        });
        // The confirmation page empties the bag once it has the order. Doing it
        // here re-rendered this page with an empty bag first, and its
        // empty-bag redirect sent the shopper to /cart instead.
        navigate(`/checkout/success?session_id=${encodeURIComponent(placed.reference)}`, { replace: true });
        return;
      }
      const session = await createCheckoutSession(
        lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
        { ...form, line2: form.line2 || null },
        saveAsDefault,
      );
      window.location.assign(session.checkoutUrl);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'cart_invalid') {
        setError('Your bag changed while you were away — please review it and try again.');
      } else {
        setError(err instanceof Error ? err.message : preorder ? 'Could not place your pre-order' : 'Could not start checkout');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-gutter py-12">
      <Link to="/cart" className="eyebrow text-ink-muted link-ink">← Back to bag</Link>
      <h1 className="display text-display-2 text-ink mt-4">{preorder ? 'Pre-order' : 'Checkout'}</h1>
      <GoldRule className="mt-6 mb-10" />
      {preorder && (
        <div className="mb-10 bg-porcelain border border-gold-500/50 rounded-sm p-5 sm:p-6 max-w-3xl">
          <p className="eyebrow text-gold-950">How pre-ordering works</p>
          <ol className="mt-3 space-y-1.5 text-sm text-ink-soft list-decimal pl-5">
            <li>Place your order below. <strong className="text-ink font-medium">Nothing is charged online.</strong></li>
            <li>We confirm availability and contact you on WhatsApp or by email to arrange payment.</li>
            <li>Once paid, we pack and ship your order. You can follow it in your account.</li>
          </ol>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-12">
        <form onSubmit={submit} className="space-y-8">
          <section>
            <h2 className="eyebrow text-ink mb-5">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <label>
                <span className={labelText}>Email</span>
                <input value={me.email} readOnly aria-readonly
                  className={`${inputCls} bg-ivory-deep text-ink-muted cursor-not-allowed`} />
              </label>
              <label>
                <span className={labelText}>{preorder ? 'Phone / WhatsApp *' : 'Phone *'}</span>
                <input type="tel" required autoComplete="tel" value={form.phone}
                  placeholder="+1 555 123 4567"
                  onChange={set('phone')} className={inputCls} />
                {preorder && (
                  <span className="mt-1 block text-xs text-ink-muted">
                    Include your country code; we'll message you here about your order.
                  </span>
                )}
              </label>
            </div>
          </section>

          <section>
            <h2 className="eyebrow text-ink mb-5">Shipping address</h2>
            {me.address ? (
              <p className="mb-5 text-[13px] text-ink-muted bg-porcelain border border-hairline rounded-xs px-4 py-3">
                ✓ Filled from your saved address — edit anything below, or manage it in{' '}
                <Link to="/account/addresses" className="link-ink text-ink">My account</Link>.
              </p>
            ) : (
              <p className="mb-5 text-[13px] text-ink-soft bg-ivory border border-gold-500/50 rounded-xs px-4 py-3">
                No saved address yet — fill it in once below and we'll remember it for
                next time. You can update it anytime in{' '}
                <Link to="/account/addresses" className="link-ink text-ink">My account</Link>.
              </p>
            )}
            <div className="grid sm:grid-cols-2 gap-5">
              <label className="sm:col-span-2">
                <span className={labelText}>Full name *</span>
                <input required autoComplete="name" value={form.name}
                  onChange={set('name')} className={inputCls} />
              </label>
              <label className="sm:col-span-2">
                <span className={labelText}>Address *</span>
                <input required autoComplete="address-line1" value={form.line1}
                  onChange={set('line1')} className={inputCls} />
              </label>
              <label className="sm:col-span-2">
                <span className={labelText}>Apartment, suite (optional)</span>
                <input autoComplete="address-line2" value={form.line2}
                  onChange={set('line2')} className={inputCls} />
              </label>
              <label>
                <span className={labelText}>City *</span>
                <input required autoComplete="address-level2" value={form.city}
                  onChange={set('city')} className={inputCls} />
              </label>
              <label>
                <span className={labelText}>State *</span>
                <input required autoComplete="address-level1" value={form.state}
                  onChange={set('state')} className={inputCls} />
              </label>
              <label>
                <span className={labelText}>ZIP / Postal code *</span>
                <input required autoComplete="postal-code" value={form.postalCode}
                  onChange={set('postalCode')} className={inputCls} />
              </label>
              <label>
                <span className={labelText}>Country *</span>
                <select
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className={inputCls}
                >
                  {(settings?.allowedShippingCountries ?? ['US']).map((c) => (
                    <option key={c} value={c}>{c === 'US' ? 'United States' : c === 'CA' ? 'Canada' : c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-5 flex items-center gap-2.5 text-sm text-ink-soft cursor-pointer">
              <input type="checkbox" checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)} />
              Save as my default address
            </label>
          </section>

          {preorder && (
            <section>
              <h2 className="eyebrow text-ink mb-5">Note (optional)</h2>
              <label className="block">
                <span className="sr-only">Note for the store</span>
                <textarea
                  value={note}
                  maxLength={NOTE_MAX}
                  rows={3}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Gift wrapping, delivery instructions, the best time to reach you…"
                  className={`${inputCls} resize-y`}
                />
                <span className="mt-1 block text-right text-xs text-ink-muted tabular">
                  {note.length}/{NOTE_MAX}
                </span>
              </label>
            </section>
          )}

          {error && (
            <p className="text-sm text-ink border border-hairline bg-ivory rounded-xs p-4">{error}</p>
          )}

          <Button variant="metal" size="lg" className="w-full sm:w-auto" loading={submitting} type="submit">
            {preorder
              ? `Place pre-order — ${formatCents(subtotal + shippingCents)}`
              : `Continue to payment — ${formatCents(subtotal + shippingCents)}`}
          </Button>
        </form>

        <aside className="lg:sticky lg:top-24 self-start bg-porcelain border border-hairline rounded-sm p-6">
          <h2 className="eyebrow text-ink mb-4">{preorder ? 'Your pre-order' : 'Order summary'}</h2>
          <ul className="divide-y divide-hairline">
            {lines.map((l) => (
              <li key={l.variantId} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{l.productName}</p>
                  {l.shadeName !== 'Default' && (
                    <p className="shade-name text-xs text-ink-soft">{l.shadeName}</p>
                  )}
                </div>
                <span className="text-xs text-ink-muted tabular">×{l.quantity}</span>
                <span className="text-sm tabular text-ink">
                  {formatCents(l.unitPriceCents * l.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <GoldRule className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular">{formatCents(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Shipping</dt>
              <dd className="tabular">{shippingCents === 0 ? 'Complimentary' : formatCents(shippingCents)}</dd>
            </div>
            <div className="flex justify-between text-base pt-2">
              <dt className="eyebrow text-ink">Total</dt>
              <dd className="tabular text-ink">{formatCents(subtotal + shippingCents)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
