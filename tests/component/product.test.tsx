import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
  previewImageUrls: [],
  swatches: [
    { id: 'v1', name: 'Rose Elixir', slug: 'rose-elixir', shadeCode: null, hexColor: '#d9738a', hexColorSecondary: null, imageUrls: [] },
    { id: 'v2', name: 'Cherry Sheen', slug: 'cherry-sheen', shadeCode: null, hexColor: '#b03246', hexColorSecondary: null, imageUrls: [] },
  ],
};

afterEach(() => {
  vi.useRealTimers();
});

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

  it("walks through the shade's photographs while the pointer rests on its bead", async () => {
    // shouldAdvanceTime keeps userEvent's own waits moving; without it the
    // pointer never arrives and the test deadlocks.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const shots = ['/uploads/p1/rose-1.webp', '/uploads/p1/rose-2.webp', '/uploads/p1/rose-3.webp'];
    render(
      <MemoryRouter>
        <ProductCard
          product={{
            ...PRODUCT,
            swatches: [
              { ...PRODUCT.swatches[0]!, shadeCode: 'HS02', name: 'Rose Petal', imageUrls: shots },
              PRODUCT.swatches[1]!,
            ],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Glass-like shine, weightless feel.')).toBeInTheDocument();

    // The beads are decorative spans inside the card's link — reach them the
    // way a pointer does, through the labelled row.
    const beads = screen.getByLabelText('2 shades').querySelectorAll(':scope > span');
    await user.hover(beads[0]!);

    const shown = () => shots.findIndex((src) =>
      document.querySelector(`img[src="${src}"]`)?.className.includes('opacity-100'));

    // Every photograph is mounted at once, so a turn is a crossfade and never
    // a load; only one of them is showing.
    for (const src of shots) expect(document.querySelector(`img[src="${src}"]`)).toBeInTheDocument();
    expect(shown()).toBe(0);
    expect(screen.getByText('HS02 Rose Petal')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/product/high-shine-lip-oil?shade=rose-elixir',
    );

    const turn = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(700); }); };
    await turn();
    expect(shown()).toBe(1);
    await turn();
    expect(shown()).toBe(2);
    await turn(); // and round again
    expect(shown()).toBe(0);

    await user.unhover(beads[0]!);
    expect(screen.getByText('Glass-like shine, weightless feel.')).toBeInTheDocument();
  });

  it("turns through the product's photographs when the pointer is on the frame", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const reel = ['/uploads/p1/one.webp', '/uploads/p1/two.webp'];
    render(
      <MemoryRouter>
        <ProductCard product={{ ...PRODUCT, previewImageUrls: reel }} />
      </MemoryRouter>,
    );

    const shown = () => reel.findIndex((src) =>
      document.querySelector(`img[src="${src}"]`)?.className.includes('opacity-100'));

    // Nothing of the reel exists until the pointer arrives — a grid must not
    // fetch every card's reel just to render the grid.
    expect(shown()).toBe(-1);
    for (const src of reel) expect(document.querySelector(`img[src="${src}"]`)).toBeNull();

    // The frame is the link's first child — the photograph's mat.
    await user.hover(screen.getByRole('link').firstElementChild!);
    expect(shown()).toBe(0);

    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(shown()).toBe(1);

    // The frame is the product, not a shade — the tagline keeps its line.
    expect(screen.getByText('Glass-like shine, weightless feel.')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/high-shine-lip-oil');
  });

  it('leaves the card alone for a shade with no photograph of its own', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProductCard product={PRODUCT} />
      </MemoryRouter>,
    );

    const beads = screen.getByLabelText('2 shades').querySelectorAll(':scope > span');
    await user.hover(beads[0]!);

    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/high-shine-lip-oil');
    expect(screen.getByText('Glass-like shine, weightless feel.')).toBeInTheDocument();
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
