import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('home', () => {
  test('opens on products, with the nav and the shipping promise', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your shade');
    // Products are the first thing in view, not below a cover.
    await expect(page.getByRole('tabpanel').getByText('High Shine Lip Oil').first()).toBeInViewport();
    // On a phone the primary nav lives behind the menu button; reach it the way
    // a shopper would rather than asserting the desktop bar.
    const menu = page.getByRole('button', { name: 'Open menu' });
    if (await menu.isVisible()) await menu.click();
    await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible();
    await expect(page.getByText('High Shine Lip Oil').first()).toBeVisible();
    await expect(page.getByText('COMPLIMENTARY SHIPPING ON ORDERS OVER $50').first()).toBeVisible();
  });

  test('the shelf tabs switch between bestsellers, new and all lips', async ({ page }) => {
    await page.goto('/');
    const panel = page.getByRole('tabpanel');
    await expect(page.getByRole('tab', { name: 'Bestsellers' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'All lips' }).click();
    await expect(page.getByRole('tab', { name: 'All lips' })).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByRole('link').first()).toBeVisible();
  });
});

test.describe('reviews', () => {
  test('the homepage shows no testimonials until real reviews exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'From the Revelle community' })).toHaveCount(0);
  });

  test('real reviews appear on the homepage with their product', async ({ page }) => {
    await page.route('**/api/reviews/recent*', (r) =>
      r.fulfill({
        json: {
          reviews: [{
            id: 'r1', rating: 5, title: 'Glass shine', body: 'Weightless and it lasts.',
            author: 'Amara J.', verifiedPurchase: true, createdAt: '2026-11-01T00:00:00Z',
            product: { slug: 'high-shine-lip-oil', name: 'High Shine Lip Oil' },
          }],
        },
      }),
    );
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'From the Revelle community' })).toBeVisible();
    await expect(page.getByText('Weightless and it lasts.')).toBeVisible();
    await expect(page.getByText('Verified purchase')).toBeVisible();
  });

  test('a product without reviews says so and asks signed-out shoppers to sign in', async ({ page }) => {
    await page.goto('/product/high-shine-lip-oil');
    const section = page.locator('#reviews');
    await expect(section.getByText('No reviews yet')).toBeVisible();
    await expect(section.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', /\/login\?next=/);
  });

  test('a product with reviews shows the average, the breakdown and the reviews', async ({ page }) => {
    await page.route('**/api/products/*/reviews?*', (r) =>
      r.fulfill({
        json: {
          summary: { average: 4.5, count: 2, distribution: [0, 0, 0, 1, 1] },
          total: 2,
          reviews: [
            { id: 'r1', rating: 5, title: null, body: 'Love the shine on this one.', author: 'Amara J.', verifiedPurchase: false, createdAt: '2026-11-01T00:00:00Z' },
            { id: 'r2', rating: 4, title: 'Nice', body: 'Lovely, a little sticky.', author: 'Dani R.', verifiedPurchase: true, createdAt: '2026-10-20T00:00:00Z' },
          ],
        },
      }),
    );
    await page.goto('/product/high-shine-lip-oil');
    const section = page.locator('#reviews');
    await expect(section.getByText('4.5', { exact: true })).toBeVisible();
    await expect(section.getByText('Love the shine on this one.')).toBeVisible();
    await expect(section.getByText('Dani R.')).toBeVisible();
    await expect(section.getByRole('list', { name: 'Ratings breakdown' })).toBeVisible();
  });
});

test.describe('shop', () => {
  test('search filter narrows the grid instantly', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByText('High Shine Lip Oil')).toBeVisible();
    await expect(page.getByText('Creamy Matte Lipstick')).toBeVisible();

    await page.getByPlaceholder('Search products or shades…').fill('matte');
    await expect(page.getByText('Creamy Matte Lipstick')).toBeVisible();
    await expect(page.getByText('High Shine Lip Oil')).not.toBeVisible();

    await page.getByText('Clear filters').click();
    await expect(page.getByText('High Shine Lip Oil')).toBeVisible();
  });

  test('price filter works', async ({ page }) => {
    await page.goto('/shop');
    await page.getByLabel('Filter by price').selectOption('10-20');
    await expect(page.getByText('High Shine Lip Oil')).toBeVisible();
    await page.getByLabel('Filter by price').selectOption('under-10');
    await expect(page.getByText('Nothing matches those filters.')).toBeVisible();
  });
});

test.describe('product page', () => {
  test('deep link selects the shade from the URL', async ({ page }) => {
    await page.goto('/product/high-shine-lip-oil?shade=cherry-sheen');
    await expect(page.getByRole('radio', { name: 'Cherry Sheen' })).toBeChecked();
  });

  test('clicking a shade updates the selection and the URL', async ({ page }) => {
    await page.goto('/product/high-shine-lip-oil');
    // default shade is Rose Elixir (isDefault)
    await expect(page.getByRole('radio', { name: 'Rose Elixir' })).toBeChecked();
    await page.getByRole('radio', { name: 'Cherry Sheen' }).click();
    await expect(page).toHaveURL(/shade=cherry-sheen/);
    await expect(page.getByRole('radio', { name: 'Cherry Sheen' })).toBeChecked();
  });

  test('sold-out shades are announced and cannot be purchased', async ({ page }) => {
    await page.goto('/product/high-shine-lip-oil?shade=clear-glaze');
    await expect(page.getByRole('radio', { name: 'Clear Glaze, sold out' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });

  test('add to bag updates the badge and the drawer shows the line', async ({ page }) => {
    await page.goto('/product/high-shine-lip-oil?shade=cherry-sheen');
    await page.getByRole('button', { name: /Add to bag/ }).click();
    await expect(page.getByRole('button', { name: 'Open bag, 1 items' })).toBeVisible();

    await page.getByRole('button', { name: 'Open bag, 1 items' }).click();
    const drawer = page.getByRole('dialog', { name: 'Shopping bag' });
    await expect(drawer.getByText('High Shine Lip Oil')).toBeVisible();
    await expect(drawer.getByText('Cherry Sheen')).toBeVisible();
    await expect(drawer.getByText('$14.99').first()).toBeVisible();
  });

  test('cart persists across a reload (localStorage)', async ({ page }) => {
    await page.goto('/product/high-shine-lip-oil?shade=cherry-sheen');
    await page.getByRole('button', { name: /Add to bag/ }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Open bag, 1 items' })).toBeVisible();
  });
});

test.describe('checkout gate', () => {
  test('checkout requires sign-in and preserves the return path', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)checkout/);
  });

  test('the login page offers registration', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible();
  });
});
