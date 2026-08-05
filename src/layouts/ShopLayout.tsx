import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useSettings } from '@/features/catalog/useCatalog';
import { useCart } from '@/features/cart/cartStore';
import { validateCart } from '@/lib/api';

export function ShopLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const { data: settings } = useSettings();
  const location = useLocation();

  // Reconcile the persisted cart against server truth once per mount.
  useEffect(() => {
    const { lines, applyValidation } = useCart.getState();
    if (lines.length === 0) return;
    validateCart(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })))
      .then((r) => applyValidation(r.lines, r.removed))
      .catch(() => {});
  }, []);

  // Scroll to top on route change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-dvh flex flex-col bg-ivory">
      {settings?.announcement && (
        <p className="bg-ink text-ivory text-center eyebrow py-2.5 px-4">
          {settings.announcement}
        </p>
      )}
      <Header onOpenCart={() => setCartOpen(true)} />
      <main className="flex-1">
        <Outlet context={{ openCart: () => setCartOpen(true) }} />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
