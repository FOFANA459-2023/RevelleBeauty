import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { ShadePicker } from '@/components/shade/ShadePicker';
import type { VariantDTO } from '@contracts/index';

const variant = (over: Partial<VariantDTO>): VariantDTO => ({
  id: 'v1',
  name: 'Rose Elixir',
  slug: 'rose-elixir',
  hexColor: '#d9738a',
  hexColorSecondary: null,
  finish: 'glossy',
  priceCents: 2200,
  inStock: true,
  isDefault: false,
  displayOrder: 1,
  imageId: null,
  ...over,
});

describe('ShadeSwatch', () => {
  it('exposes the hex via the --shade CSS variable (the Tailwind v4 rule)', () => {
    render(<ShadeSwatch hex="#b03246" name="Cherry Sheen" />);
    const btn = screen.getByRole('radio', { name: 'Cherry Sheen' });
    expect(btn.style.getPropertyValue('--shade')).toBe('#b03246');
  });

  it('marks selection with aria-checked, not color alone', () => {
    render(<ShadeSwatch hex="#b03246" name="Cherry Sheen" selected />);
    expect(screen.getByRole('radio', { name: 'Cherry Sheen' })).toBeChecked();
  });

  it('announces sold-out shades in the accessible name', () => {
    render(<ShadeSwatch hex="#b03246" name="Cherry Sheen" soldOut />);
    expect(screen.getByRole('radio', { name: 'Cherry Sheen, sold out' })).toBeInTheDocument();
  });

  it('renders duochrome shades with the second variable', () => {
    render(<ShadeSwatch hex="#c9a24a" hexSecondary="#f0dfae" name="Gold Dust" />);
    const btn = screen.getByRole('radio', { name: 'Gold Dust' });
    expect(btn.style.getPropertyValue('--shade-2')).toBe('#f0dfae');
    expect(btn).toHaveAttribute('data-duo');
  });

  it('non-interactive mode renders no focusable control', () => {
    render(<ShadeSwatch hex="#b03246" name="Cherry Sheen" interactive={false} />);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });
});

describe('ShadePicker', () => {
  const shades = [
    variant({ id: 'v1', name: 'Clear Glaze', slug: 'clear-glaze', hexColor: '#f6ece4' }),
    variant({ id: 'v2', name: 'Rose Elixir', slug: 'rose-elixir', hexColor: '#d9738a' }),
    variant({ id: 'v3', name: 'Cherry Sheen', slug: 'cherry-sheen', hexColor: '#b03246' }),
  ];

  it('renders a radiogroup with the selected shade name in the label row', () => {
    render(<ShadePicker label="Shade" variants={shades} value={shades[1]!} onChange={() => {}} />);
    expect(screen.getByRole('radiogroup', { name: 'Shade' })).toBeInTheDocument();
    expect(screen.getByText('Rose Elixir')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Rose Elixir' })).toBeChecked();
  });

  it('selects on click', async () => {
    const onChange = vi.fn();
    render(<ShadePicker label="Shade" variants={shades} value={shades[0]!} onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Cherry Sheen' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'v3' }));
  });

  it('arrow keys move the selection (roving radiogroup)', async () => {
    const onChange = vi.fn();
    render(<ShadePicker label="Shade" variants={shades} value={shades[1]!} onChange={onChange} />);
    screen.getByRole('radio', { name: 'Rose Elixir' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'v3' }));
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'v1' }));
  });

  it('Home and End jump to the palette edges', async () => {
    const onChange = vi.fn();
    render(<ShadePicker label="Shade" variants={shades} value={shades[1]!} onChange={onChange} />);
    screen.getByRole('radio', { name: 'Rose Elixir' }).focus();
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'v3' }));
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'v1' }));
  });

  it('renders nothing for products with no shade variants (e.g. lip scrub)', () => {
    const { container } = render(
      <ShadePicker
        label="Type"
        variants={[variant({ hexColor: null })]}
        value={null}
        onChange={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
