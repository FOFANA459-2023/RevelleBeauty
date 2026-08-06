import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test.describe('home', () => {
  test('renders the hero, nav, and featured products', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Be Revelle');
    await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible();
    await expect(page.getByText('High Shine Lip Oil').first()).toBeVisible();
    await expect(page.getByText('COMPLIMENTARY SHIPPING ON ORDERS OVER $50').first()).toBeVisible();
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
    await page.getByLabel('Filter by price').selectOption('20-30');
    await expect(page.getByText('High Shine Lip Oil')).toBeVisible();
    await page.getByLabel('Filter by price').selectOption('under-20');
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
    await expect(drawer.getByText('$22.00').first()).toBeVisible();
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
