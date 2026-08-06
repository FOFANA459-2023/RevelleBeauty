import type { Page } from '@playwright/test';

/**
 * API mocks for E2E: the UI is exercised end-to-end in a real browser while
 * the network boundary is stubbed with contract-shaped fixtures, so the
 * frontend repo's CI needs no backend, database, or credentials.
 */

const swatches = [
  { id: 'v1', name: 'Clear Glaze', slug: 'clear-glaze', hexColor: '#f6ece4', hexColorSecondary: null },
  { id: 'v2', name: 'Rose Elixir', slug: 'rose-elixir', hexColor: '#d9738a', hexColorSecondary: null },
  { id: 'v3', name: 'Cherry Sheen', slug: 'cherry-sheen', hexColor: '#b03246', hexColorSecondary: null },
];

const summary = {
  id: 'p1',
  slug: 'high-shine-lip-oil',
  name: 'High Shine Lip Oil',
  tagline: 'Glass-like shine, weightless feel.',
  categoryId: 'c-lip-oil',
  categorySlug: 'lip-oil',
  priceCents: 2200,
  priceMaxCents: 2200,
  compareAtPriceCents: null,
  isFeatured: true,
  inStock: true,
  primaryImage: null,
  swatches,
};

const summary2 = {
  ...summary,
  id: 'p2',
  slug: 'creamy-matte-lipstick',
  name: 'Creamy Matte Lipstick',
  tagline: 'Velvet color, zero drag.',
  categorySlug: 'lip-color',
  priceCents: 2400,
  priceMaxCents: 2400,
  isFeatured: false,
  swatches: [
    { id: 'v9', name: 'Classic Red', slug: 'classic-red', hexColor: '#b31b2c', hexColorSecondary: null },
  ],
};

const detail = {
  ...summary,
  description: 'A nourishing lip oil with mirror shine.',
  ingredients: null,
  howToUse: null,
  variantLabel: 'Shade',
  variants: swatches.map((s, i) => ({
    ...s,
    finish: 'glossy',
    priceCents: 2200,
    inStock: s.id !== 'v1', // Clear Glaze sold out — exercises the slash state
    isDefault: i === 1,
    displayOrder: i + 1,
    imageId: null,
  })),
  images: [],
  meta: { title: null, description: null },
};

export async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/settings', (r) =>
    r.fulfill({
      json: {
        currency: 'USD',
        flatShippingCents: 599,
        freeShippingThresholdCents: 5000,
        announcement: 'COMPLIMENTARY SHIPPING ON ORDERS OVER $50',
        checkoutEnabled: true,
        allowedShippingCountries: ['US'],
      },
    }),
  );

  await page.route('**/api/categories', (r) =>
    r.fulfill({
      json: {
        categories: [
          {
            id: 'c-lips', slug: 'lips', name: 'Lips', description: null, urlPath: '/shop/lips',
            displayOrder: 1, productCount: 2,
            children: [
              { id: 'c-lip-oil', slug: 'lip-oil', name: 'Lip Products & Oil', description: null, urlPath: '/shop/lips/lip-oil', displayOrder: 1, productCount: 1, children: [] },
              { id: 'c-lip-color', slug: 'lip-color', name: 'Lip Color', description: null, urlPath: '/shop/lips/lip-color', displayOrder: 2, productCount: 1, children: [] },
            ],
          },
          { id: 'c-skin', slug: 'skincare', name: 'Skincare', description: null, urlPath: '/shop/skincare', displayOrder: 2, productCount: 0, children: [] },
        ],
      },
    }),
  );

  await page.route('**/api/products?*', (r) =>
    r.fulfill({ json: { products: [summary, summary2], total: 2, limit: 60, offset: 0 } }),
  );
  await page.route('**/api/products', (r) =>
    r.fulfill({ json: { products: [summary, summary2], total: 2, limit: 24, offset: 0 } }),
  );

  await page.route('**/api/products/high-shine-lip-oil/related*', (r) =>
    r.fulfill({ json: { products: [summary2], meta: [] } }),
  );
  await page.route('**/api/products/high-shine-lip-oil', (r) =>
    r.fulfill({ json: { product: detail } }),
  );

  await page.route('**/api/cart/validate', (r) =>
    r.fulfill({
      json: {
        lines: detail.variants
          .filter((v) => v.inStock)
          .map((v) => ({
            variantId: v.id,
            productId: 'p1',
            productSlug: 'high-shine-lip-oil',
            productName: 'High Shine Lip Oil',
            variantName: v.name,
            variantSlug: v.slug,
            hexColor: v.hexColor,
            hexColorSecondary: null,
            unitPriceCents: 2200,
            available: true,
            maxQuantity: 10,
            imageUrl: null,
          })),
        removed: [],
      },
    }),
  );

  // Signed out by default — checkout must bounce to /login.
  await page.route('**/api/auth/me', (r) =>
    r.fulfill({
      status: 401,
      json: { error: { code: 'unauthorized', message: 'Please sign in' } },
    }),
  );
}
