import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import '@/styles/theme.css';

import { ShopLayout } from '@/layouts/ShopLayout';
import { HomePage } from '@/pages/shop/HomePage';
import { CategoryPage } from '@/pages/shop/CategoryPage';
import { ProductPage } from '@/pages/shop/ProductPage';
import { CartPage } from '@/pages/shop/CartPage';
import { CheckoutPage } from '@/pages/shop/CheckoutPage';
import { LoginPage, RegisterPage } from '@/pages/shop/AuthPages';
import { AccountPage, AccountOrderPage } from '@/pages/account/AccountPages';
import { CheckoutSuccessPage } from '@/pages/shop/CheckoutSuccessPage';
import { MockCheckoutPage } from '@/pages/shop/MockCheckoutPage';
import { ShadeLibraryPage } from '@/pages/shop/ShadeLibraryPage';
import { AboutPage, ContactPage, NotFoundPage } from '@/pages/shop/StaticPages';

// Admin: lazy — never in the shopper bundle.
const AdminLayout = lazy(() =>
  import('@/layouts/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminLoginPage = lazy(() =>
  import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminProductListPage = lazy(() =>
  import('@/pages/admin/AdminProductListPage').then((m) => ({ default: m.AdminProductListPage })),
);
const AdminProductEditorPage = lazy(() =>
  import('@/pages/admin/AdminProductEditorPage').then((m) => ({ default: m.AdminProductEditorPage })),
);
const AdminOrderListPage = lazy(() =>
  import('@/pages/admin/AdminOrderPages').then((m) => ({ default: m.AdminOrderListPage })),
);
const AdminOrderDetailPage = lazy(() =>
  import('@/pages/admin/AdminOrderPages').then((m) => ({ default: m.AdminOrderDetailPage })),
);
const StyleguidePage = lazy(() =>
  import('@/pages/dev/StyleguidePage').then((m) => ({ default: m.StyleguidePage })),
);

const fallback = (
  <div className="min-h-dvh bg-ivory grid place-items-center text-sm text-ink-muted">Loading…</div>
);

const router = createBrowserRouter([
  {
    element: <ShopLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/shop', element: <CategoryPage /> },
      { path: '/shop/:categorySlug', element: <CategoryPage /> },
      { path: '/shop/:categorySlug/:subcategorySlug', element: <CategoryPage /> },
      { path: '/product/:productSlug', element: <ProductPage /> },
      { path: '/shades', element: <ShadeLibraryPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/account', element: <AccountPage /> },
      { path: '/account/orders/:id', element: <AccountOrderPage /> },
      { path: '/checkout/success', element: <CheckoutSuccessPage /> },
      { path: '/checkout/mock', element: <MockCheckoutPage /> },
      { path: '/checkout/cancel', element: <Navigate to="/cart" replace /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      ...(import.meta.env.DEV
        ? [{ path: '/styleguide', element: <Suspense fallback={fallback}><StyleguidePage /></Suspense> }]
        : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin/login',
    element: <Suspense fallback={fallback}><AdminLoginPage /></Suspense>,
  },
  {
    path: '/admin',
    element: <Suspense fallback={fallback}><AdminLayout /></Suspense>,
    children: [
      { index: true, element: <Navigate to="/admin/products" replace /> },
      { path: 'products', element: <AdminProductListPage /> },
      { path: 'products/new', element: <AdminProductEditorPage /> },
      { path: 'products/:id', element: <AdminProductEditorPage /> },
      { path: 'orders', element: <AdminOrderListPage /> },
      { path: 'orders/:id', element: <AdminOrderDetailPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
