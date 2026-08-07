import { useEffect, useRef } from 'react';
import { useCustomer } from '@/features/auth/useCustomer';
import { useCart, type CartLine } from '@/features/cart/cartStore';
import * as api from '@/lib/api';

/**
 * Keeps the bag attached to the ACCOUNT, not the browser.
 *
 * On sign-in: pull the server cart, merge it with whatever is in this
 * browser (max quantity wins per shade), hydrate display data from
 * /cart/validate, and write the merged result back. After that, every local
 * cart change is pushed (debounced), so a phone and a laptop always show
 * the same bag.
 */
export function useCartSync(): void {
  const { data: me } = useCustomer();
  const lines = useCart((s) => s.lines);
  // Which customer the local store has been merged for.
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!me) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === me.id) return;

    let cancelled = false;
    (async () => {
      try {
        const server = await api.getServerCart();
        const qty = new Map<string, number>();
        for (const l of useCart.getState().lines) qty.set(l.variantId, l.quantity);
        for (const it of server) qty.set(it.variantId, Math.max(qty.get(it.variantId) ?? 0, it.quantity));

        if (qty.size > 0) {
          const wanted = [...qty.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
          const v = await api.validateCart(wanted);
          if (cancelled) return;
          const removed = new Set(v.removed);
          const now = Date.now();
          const merged: CartLine[] = v.lines
            .filter((l) => l.available && !removed.has(l.variantId))
            .map((l) => ({
              variantId: l.variantId,
              productId: l.productId,
              productSlug: l.productSlug,
              productName: l.productName,
              shadeName: l.variantName,
              shadeHex: l.hexColor,
              shadeHexSecondary: l.hexColorSecondary,
              imageUrl: l.imageUrl,
              unitPriceCents: l.unitPriceCents,
              maxQuantity: l.maxQuantity,
              quantity: Math.min(qty.get(l.variantId) ?? 1, l.maxQuantity),
              addedAt: now,
            }));
          useCart.setState({ lines: merged });
          await api.putServerCart(merged.map((l) => ({ variantId: l.variantId, quantity: l.quantity })));
        }
        hydratedFor.current = me.id;
      } catch {
        // Offline or transient failure — local cart still works; retry next mount.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me]);

  // Push local changes once hydrated, debounced.
  useEffect(() => {
    if (!me || hydratedFor.current !== me.id) return;
    const t = setTimeout(() => {
      void api
        .putServerCart(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })))
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [lines, me]);
}
