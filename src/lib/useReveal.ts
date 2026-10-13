import { useLayoutEffect, useRef } from 'react';

/**
 * Scroll reveal, one observer per page region.
 *
 * Mark the root with the returned ref and any element inside it with
 * `data-reveal`; it rises into place the first time it is scrolled to, then
 * is left alone. Stagger a row by setting `--reveal-delay` per item.
 *
 * The hiding rule in motion.css is scoped to `[data-reveal-ready]`, which this
 * hook adds at runtime — so if the script never runs, nothing is ever hidden.
 * Reduced motion and browsers without IntersectionObserver reveal everything
 * immediately, which is also what the server-rendered markup looks like.
 *
 * `deps` re-scans after content arrives (a grid that was loading, say).
 *
 * It arms in a layout effect, before the browser paints: with a plain effect
 * the content paints at full opacity for one frame and then drops to hidden,
 * which reads as a flicker exactly where the eye is already looking.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reveal = (el: Element) => el.setAttribute('data-revealed', '');
    const targets = root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revealed])');
    if (targets.length === 0) return;

    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.setAttribute('data-reveal-ready', '');

    if (still || typeof IntersectionObserver === 'undefined') {
      targets.forEach(reveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      // Fire a little before the element is fully in — the rise should finish
      // about when the eye reaches it, not start then.
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/** Staggered delay for a row or grid, capped so late items are not stranded. */
export function revealDelay(index: number, step = 70, max = 420): Record<string, string> {
  return { '--reveal-delay': `${Math.min(index * step, max)}ms` };
}
