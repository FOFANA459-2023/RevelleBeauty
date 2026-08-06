import { beforeEach, describe, expect, it } from 'vitest';
import { useCart, selectItemCount, selectSubtotalCents } from '@/features/cart/cartStore';

const LINE = {
  variantId: 'v1',
  productId: 'p1',
  productSlug: 'high-shine-lip-oil',
  productName: 'High Shine Lip Oil',
  shadeName: 'Rose Elixir',
  shadeHex: '#d9738a',
  shadeHexSecondary: null,
  imageUrl: null,
  unitPriceCents: 2200,
  maxQuantity: 10,
};

beforeEach(() => {
  useCart.getState().clear();
});

describe('cartStore', () => {
  it('adds a line and counts items', () => {
    useCart.getState().add(LINE, 2);
    expect(selectItemCount(useCart.getState())).toBe(2);
    expect(selectSubtotalCents(useCart.getState())).toBe(4400);
  });

  it('merges quantities for the same variant (identity = variantId)', () => {
    useCart.getState().add(LINE, 1);
    useCart.getState().add(LINE, 2);
    expect(useCart.getState().lines).toHaveLength(1);
    expect(useCart.getState().lines[0]!.quantity).toBe(3);
  });

  it('keeps different shades of one product as distinct lines', () => {
    useCart.getState().add(LINE, 1);
    useCart.getState().add({ ...LINE, variantId: 'v2', shadeName: 'Cherry Sheen', shadeHex: '#b03246' }, 1);
    expect(useCart.getState().lines).toHaveLength(2);
  });

  it('clamps quantity at maxQuantity', () => {
    useCart.getState().add({ ...LINE, maxQuantity: 3 }, 5);
    expect(useCart.getState().lines[0]!.quantity).toBe(3);
  });

  it('setQuantity(0) removes the line', () => {
    useCart.getState().add(LINE, 1);
    useCart.getState().setQuantity('v1', 0);
    expect(useCart.getState().lines).toHaveLength(0);
  });

  it('applyValidation overwrites display prices with server truth and flags the change', () => {
    useCart.getState().add(LINE, 2);
    useCart.getState().applyValidation(
      [
        {
          variantId: 'v1',
          productId: 'p1',
          productSlug: 'high-shine-lip-oil',
          productName: 'High Shine Lip Oil',
          variantName: 'Rose Elixir',
          variantSlug: 'rose-elixir',
          hexColor: '#d9738a',
          hexColorSecondary: null,
          unitPriceCents: 2500, // price went up server-side
          available: true,
          maxQuantity: 10,
          imageUrl: null,
        },
      ],
      [],
    );
    const s = useCart.getState();
    expect(s.lines[0]!.unitPriceCents).toBe(2500);
    expect(s.reconciled).toBe(true);
  });

  it('applyValidation drops removed and unavailable variants', () => {
    useCart.getState().add(LINE, 1);
    useCart.getState().add({ ...LINE, variantId: 'v2', shadeName: 'Gone' }, 1);
    useCart.getState().applyValidation(
      [
        {
          variantId: 'v1',
          productId: 'p1',
          productSlug: 'x',
          productName: 'X',
          variantName: 'Rose Elixir',
          variantSlug: 'rose-elixir',
          hexColor: '#d9738a',
          hexColorSecondary: null,
          unitPriceCents: 2200,
          available: false, // sold out server-side
          maxQuantity: 0,
          imageUrl: null,
        },
      ],
      ['v2'], // archived server-side
    );
    expect(useCart.getState().lines).toHaveLength(0);
    expect(useCart.getState().reconciled).toBe(true);
  });

  it('clamps quantity down when server maxQuantity shrank', () => {
    useCart.getState().add(LINE, 8);
    useCart.getState().applyValidation(
      [
        {
          variantId: 'v1',
          productId: 'p1',
          productSlug: 'x',
          productName: 'X',
          variantName: 'Rose Elixir',
          variantSlug: 'rose-elixir',
          hexColor: '#d9738a',
          hexColorSecondary: null,
          unitPriceCents: 2200,
          available: true,
          maxQuantity: 3,
          imageUrl: null,
        },
      ],
      [],
    );
    expect(useCart.getState().lines[0]!.quantity).toBe(3);
  });
});
