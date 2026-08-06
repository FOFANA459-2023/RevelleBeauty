import { describe, expect, it } from 'vitest';
import { formatCents, formatPriceRange } from '@/lib/money';

describe('money', () => {
  it('formats integer cents as USD', () => {
    expect(formatCents(2200)).toBe('$22.00');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(4999)).toBe('$49.99');
  });

  it('never produces float drift for awkward values', () => {
    expect(formatCents(1)).toBe('$0.01');
    expect(formatCents(1005)).toBe('$10.05');
  });

  it('collapses equal ranges to a single price', () => {
    expect(formatPriceRange(2200, 2200)).toBe('$22.00');
  });

  it('renders true ranges with an en dash', () => {
    expect(formatPriceRange(1800, 2600)).toBe('$18.00–$26.00');
  });
});
