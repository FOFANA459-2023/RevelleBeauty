import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrderConfirmation } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useCart } from '@/features/cart/cartStore';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import { formatCents } from '@/lib/money';
import { useSettings } from '@/features/catalog/useCatalog';
import { Button } from '@/components/ui/Button';

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id') ?? '';
  const clearedRef = useRef(false);
  const { data: settings } = useSettings();

  // The redirect can beat the webhook: poll while 'processing' (2s, ~20s).
  const { data, isPending } = useQuery({
    queryKey: queryKeys.confirmation(sessionId),
    queryFn: () => getOrderConfirmation(sessionId),
    enabled: Boolean(sessionId),
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' && (query.state.dataUpdateCount ?? 0) < 10
        ? 2000
        : false,
  });

  // Clear the cart ONLY after the order is confirmed paid.
  useEffect(() => {
    if ((data?.status === 'paid' || data?.status === 'preorder') && !clearedRef.current) {
      clearedRef.current = true;
      useCart.getState().clear();
    }
  }, [data?.status]);

  if (!sessionId) {
    return (
      <CenteredMessage title="Missing order reference.">
        <Link to="/shop" className="link-ink text-sm text-ink">Return to the collection</Link>
      </CenteredMessage>
    );
  }

  if (isPending || data?.status === 'processing') {
    return (
      <CenteredMessage title="Confirming your order…">
        <p className="text-sm text-ink-muted">This usually takes a moment.</p>
      </CenteredMessage>
    );
  }

  if (!data || data.status === 'expired' || data.status === 'failed' || !data.order) {
    return (
      <CenteredMessage title="We couldn't confirm this order.">
        <p className="text-sm text-ink-muted">
          If you completed payment, you'll receive an email confirmation shortly.
        </p>
        <Link to="/cart" className="link-ink text-sm text-ink">Return to your bag</Link>
      </CenteredMessage>
    );
  }

  const order = data.order;
  const isPreorder = data.status === 'preorder';
  const chat = settings?.storeWhatsapp
    ? `https://wa.me/${settings.storeWhatsapp}?text=${encodeURIComponent(`Hi Revelle Beauty, I placed pre-order ${order.orderNumber}.`)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl px-gutter py-16">
      <div className="text-center">
        <Sparkle size={28} className="text-gold-500" />
        <p className="eyebrow text-gold-950 mt-6">{isPreorder ? 'Pre-order' : 'Order'} {order.orderNumber}</p>
        <h1 className="display text-display-2 text-ink mt-4">Thank you.</h1>
        {isPreorder ? (
          <>
            <p className="mt-4 text-body text-ink-soft">
              Your pre-order is in, and nothing has been charged. We'll contact you on WhatsApp
              or by email shortly to confirm availability and arrange payment and delivery.
              {order.email ? ` A copy is on its way to ${order.email}.` : ''}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {chat && (
                <a href={chat} target="_blank" rel="noreferrer">
                  <Button variant="metal">Message us on WhatsApp</Button>
                </a>
              )}
              <Link to="/account/orders">
                <Button variant="outline">View my orders</Button>
              </Link>
            </div>
          </>
        ) : (
          <p className="mt-4 text-body text-ink-soft">
            Your order is confirmed{order.email ? ` — a receipt is on its way to ${order.email}` : ''}.
          </p>
        )}
      </div>

      <div className="mt-12 bg-porcelain border border-hairline rounded-sm p-6 sm:p-8">
        <ul className="divide-y divide-hairline">
          {order.items.map((item, i) => (
            <li key={i} className="py-4 flex items-center gap-4">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" className="w-16 h-16 object-contain bg-white border border-hairline rounded-xs" />
              ) : item.variantHex ? (
                <ShadeSwatch hex={item.variantHex} name={item.variantName} size={36} interactive={false} />
              ) : (
                <span className="w-14 h-16 grid place-items-center bg-ivory-deep rounded-xs font-display text-gold-300">RB</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink">{item.productName}</p>
                {item.variantName !== 'Default' && (
                  <p className="shade-name text-sm text-ink-soft">{item.variantName}</p>
                )}
                <p className="text-xs text-ink-muted tabular">Qty {item.quantity}</p>
              </div>
              <span className="tabular text-sm text-ink">{formatCents(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>
        <GoldRule className="my-5" />
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
          {order.taxCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-muted">Tax</dt>
              <dd className="tabular">{formatCents(order.taxCents)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base pt-2">
            <dt className="eyebrow text-ink">Total</dt>
            <dd className="tabular text-ink">{formatCents(order.totalCents)}</dd>
          </div>
        </dl>
        {order.shipping && (
          <>
            <GoldRule className="my-5" />
            <p className="eyebrow text-ink-muted mb-2">Ships to</p>
            <p className="text-sm text-ink-soft leading-relaxed">
              {order.shipping.name}<br />
              {order.shipping.line1}{order.shipping.line2 ? <><br />{order.shipping.line2}</> : null}<br />
              {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}
            </p>
          </>
        )}
      </div>

      <p className="text-center mt-10">
        <Link to="/shop" className="link-ink text-sm text-ink">Continue shopping</Link>
      </p>
    </div>
  );
}

function CenteredMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="py-32 text-center px-gutter space-y-4">
      <Sparkle size={24} className="text-gold-300" />
      <h1 className="font-display text-h2 text-ink">{title}</h1>
      {children}
    </div>
  );
}
