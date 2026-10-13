import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductGallery } from '@/components/product/ProductGallery';
import type { ImageDTO } from '@contracts/index';

// jsdom has no layout engine: scrollTo/scrollIntoView are absent and
// clientWidth is 0, so the index comes from the click, not from scroll.
beforeAll(() => {
  Element.prototype.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

const image = (n: number, variantId: string | null): ImageDTO => ({
  id: `i${n}`,
  url: `/uploads/${n}.webp`,
  altText: `photo ${n}`,
  width: 1200,
  height: 1500,
  isPrimary: n === 1,
  variantId,
  displayOrder: n,
});

const IMAGES = [image(1, 'v1'), image(2, 'v1'), image(3, null)];

describe('ProductGallery', () => {
  it('shows every photograph of the shade with a position counter', () => {
    render(<ProductGallery images={IMAGES} productName="High Shine Lip Oil" shadeLabel="HS01 Crystal Clear" />);

    expect(screen.getAllByRole('group', { name: /^\d+ of 3$/ })).toHaveLength(3);
    expect(screen.getByText('01 / 03')).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: /High Shine Lip Oil, HS01 Crystal Clear/ }),
    ).toBeInTheDocument();
  });

  it('starts at the first photograph, so there is nothing to step back to', () => {
    render(<ProductGallery images={IMAGES} productName="High Shine Lip Oil" shadeLabel={null} />);

    expect(screen.getByRole('button', { name: 'Previous photograph' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next photograph' })).toBeEnabled();
  });

  it('marks the thumbnail that is showing', async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={IMAGES} productName="High Shine Lip Oil" shadeLabel={null} />);

    const third = screen.getByRole('button', { name: 'Show photograph 3 of 3' });
    await user.click(third);

    expect(third).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'Show photograph 1 of 3' }))
      .toHaveAttribute('aria-current', 'false');
    expect(screen.getByText('03 / 03')).toBeInTheDocument();
  });

  it('drops the carousel chrome when a shade has a single photograph', () => {
    render(<ProductGallery images={[IMAGES[0]!]} productName="High Shine Lip Oil" shadeLabel={null} />);

    expect(screen.queryByRole('button', { name: 'Next photograph' })).not.toBeInTheDocument();
    expect(screen.queryByText(/01 \/ 01/)).not.toBeInTheDocument();
  });
});
