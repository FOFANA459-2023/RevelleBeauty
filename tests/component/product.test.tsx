import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { ProductCard } from '@/components/product/ProductCard';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { Button } from '@/components/ui/Button';
import type { ProductSummaryDTO } from '@contracts/index';

const PRODUCT: ProductSummaryDTO = {
  id: 'p1',
  slug: 'high-shine-lip-oil',
  name: 'High Shine Lip Oil',
  tagline: 'Glass-like shine, weightless feel.',
  categoryId: 'c1',
  categorySlug: 'lip-oil',
  priceCents: 2200,
  priceMaxCents: 2200,
  compareAtPriceCents: null,
  isFeatured: true,
  inStock: true,
  primaryImage: null,
  swatches: [
    { id: 'v1', name: 'Rose Elixir', slug: 'rose-elixir', hexColor: '#d9738a', hexColorSecondary: null },
    { id: 'v2', name: 'Cherry Sheen', slug: 'cherry-sheen', hexColor: '#b03246', hexColorSecondary: null },
  ],
};

describe('ProductCard', () => {
  it('links to the product page and shows name, price, and shade count', () => {
    render(
      <MemoryRouter>
        <ProductCard product={PRODUCT} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/high-shine-lip-oil');
    expect(screen.getByText('High Shine Lip Oil')).toBeInTheDocument();
    expect(screen.getByText('$22.00')).toBeInTheDocument();
    expect(screen.getByLabelText('2 shades')).toBeInTheDocument();
  });

  it('shows a sold-out badge when out of stock', () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...PRODUCT, inStock: false }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });

  it('renders a price range when variants override prices', () => {
    render(
      <MemoryRouter>
        <ProductCard product={{ ...PRODUCT, priceCents: 1800, priceMaxCents: 2600 }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('$18.00–$26.00')).toBeInTheDocument();
  });
});

describe('QuantityStepper', () => {
  it('increments and decrements within bounds', async () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={2} min={1} max={3} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(onChange).toHaveBeenCalledWith(3);
    await userEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('disables the controls at the bounds', () => {
    render(<QuantityStepper value={1} min={1} max={1} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });
});

describe('Button', () => {
  it('blocks clicks while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Add to bag
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn).catch(() => {});
    expect(onClick).not.toHaveBeenCalled();
  });

  it('metal variant carries ink text (never white-on-gold)', () => {
    render(<Button variant="metal">Checkout</Button>);
    expect(screen.getByRole('button').className).toContain('metal-surface');
    expect(screen.getByRole('button').className).toContain('text-ink');
  });
});
