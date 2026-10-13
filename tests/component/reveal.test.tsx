import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { revealDelay, useReveal } from '@/lib/useReveal';

function Page() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="root">
      <p data-reveal>first</p>
      <p data-reveal="still">second</p>
    </div>
  );
}

/** Arrow functions cannot be constructed with `new`, so stub it as a class. */
function stubObserver(observe: () => void) {
  globalThis.IntersectionObserver = class {
    observe = observe;
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof IntersectionObserver;
}

const originalIO = globalThis.IntersectionObserver;
afterEach(() => {
  globalThis.IntersectionObserver = originalIO;
  vi.unstubAllGlobals();
});

describe('useReveal', () => {
  it('reveals everything at once where IntersectionObserver is unavailable', () => {
    // jsdom has no IntersectionObserver — the same path a very old browser takes.
    render(<Page />);

    expect(screen.getByTestId('root')).toHaveAttribute('data-reveal-ready');
    expect(screen.getByText('first')).toHaveAttribute('data-revealed');
    expect(screen.getByText('second')).toHaveAttribute('data-revealed');
  });

  it('reveals everything at once when the reader asked for less motion', () => {
    const observe = vi.fn();
    stubObserver(observe);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    render(<Page />);

    expect(screen.getByText('first')).toHaveAttribute('data-revealed');
    expect(observe).not.toHaveBeenCalled();
  });

  it('observes each target when motion is welcome, and hides nothing itself', () => {
    const observe = vi.fn();
    stubObserver(observe);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));

    render(<Page />);

    expect(observe).toHaveBeenCalledTimes(2);
    // The element only hides via CSS under a ready root — never inline, so a
    // failed script can never leave the page blank.
    expect(screen.getByText('first')).not.toHaveAttribute('data-revealed');
    expect(screen.getByText('first').getAttribute('style')).toBeNull();
  });
});

describe('revealDelay', () => {
  it('staggers a row and then stops, so late items are not stranded', () => {
    expect(revealDelay(0)).toEqual({ '--reveal-delay': '0ms' });
    expect(revealDelay(3)).toEqual({ '--reveal-delay': '210ms' });
    expect(revealDelay(40)).toEqual({ '--reveal-delay': '420ms' });
  });
});
