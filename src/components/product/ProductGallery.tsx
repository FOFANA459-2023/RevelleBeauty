import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { ImageDTO } from '@contracts/index';
import { cn } from '@/lib/cn';

/**
 * The sliding window: one shade's photographs, swiped or stepped through.
 *
 * Built on native scroll-snap rather than a transform carousel — touch gets
 * real momentum and the browser does the physics. The index is read back off
 * scrollLeft, so swipe, arrows and thumbnails all agree without fighting.
 *
 * Mount it with key={shade.id}: a new shade is a new window, scrolled home.
 */
export function ProductGallery({
  images,
  productName,
  shadeLabel,
}: {
  images: ImageDTO[];
  productName: string;
  shadeLabel: string | null;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;
  // A scroll we are driving ourselves: while it runs, scrollLeft is ours and
  // the reader below must not fight it.
  const glide = useRef<number | null>(null);

  /**
   * Depth, driven straight off scrollLeft rather than by a transition: the
   * photograph a shopper is dragging toward drifts in against the direction of
   * travel, grows to full size and clears, while the one leaving falls back.
   * A flat horizontal slide of letterboxed product shots mostly moves empty
   * mat around; this is what makes it read as a gallery.
   */
  const paint = useCallback(() => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;
    const w = el.clientWidth;
    for (let i = 0; i < el.children.length; i++) {
      const shot = el.children[i]?.firstElementChild as HTMLElement | undefined;
      if (!shot) continue;
      // 0 while centred, ±1 one photograph away.
      const p = Math.max(-1.5, Math.min(1.5, (i * w - el.scrollLeft) / w));
      const away = Math.min(Math.abs(p), 1);
      // Transform only — the hover lean uses the `scale` property, so the two
      // compose instead of overwriting each other.
      shot.style.transform = `translate3d(${p * -18}%, 0, 0) scale(${1 - away * 0.08})`;
      shot.style.opacity = String(1 - away * 0.55);
    }
  }, []);

  // scrollLeft is the single source of truth; rAF-coalesced so a flung swipe
  // does not re-render per frame.
  const ticking = useRef(false);
  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      paint();
      // While we are driving the scroll ourselves the index is already set;
      // reading it back would only re-announce the slides we pass through.
      if (glide.current !== null) return;
      const el = trackRef.current;
      if (!el || el.clientWidth === 0) return;
      setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth))));
    });
  }, [count, paint]);

  // First paint, and again whenever the stage is resized under the photographs.
  useEffect(() => {
    paint();
    if (typeof ResizeObserver === 'undefined') return;
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(el);
    return () => ro.disconnect();
  }, [paint, count]);

  const stopGlide = useCallback(() => {
    if (glide.current === null) return;
    cancelAnimationFrame(glide.current);
    glide.current = null;
    const el = trackRef.current;
    if (el) el.style.scrollSnapType = '';
  }, []);

  const goTo = useCallback((next: number, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(count - 1, next));
    setIndex(clamped);
    stopGlide();

    const to = clamped * el.clientWidth;
    const from = el.scrollLeft;
    const distance = to - from;
    const still =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!smooth || still || distance === 0 || typeof requestAnimationFrame === 'undefined') {
      el.scrollLeft = to;
      return;
    }

    // The browser's own smooth scroll is brisk and linear-ish. This is the
    // house glide: a long ease-out, scaled a little by how far it travels, so
    // a step to the next photograph and a jump across the roll both land
    // softly. Snapping is suspended meanwhile or it tugs against each frame.
    const span = Math.abs(distance) / Math.max(1, el.clientWidth);
    const duration = Math.min(1300, 760 + span * 170);
    const start = performance.now();
    el.style.scrollSnapType = 'none';

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out quint — the same late, slow settle as --ease-couture.
      const eased = 1 - Math.pow(1 - t, 5);
      el.scrollLeft = from + distance * eased;
      paint();
      if (t < 1) {
        glide.current = requestAnimationFrame(step);
      } else {
        glide.current = null;
        el.style.scrollSnapType = '';
      }
    };
    glide.current = requestAnimationFrame(step);
  }, [count, stopGlide, paint]);

  // A hand on the track always wins over a glide in flight.
  useEffect(() => stopGlide, [stopGlide]);

  // Keep the active thumbnail in view as the window slides.
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    thumbRefs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [index]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(count - 1); }
  };

  const described = shadeLabel ? `${productName}, ${shadeLabel}` : productName;

  return (
    <div className="window-in">
      <div
        className="group relative"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${described} — photographs`}
      >
        <div
          ref={trackRef}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          onPointerDown={stopGlide}
          onWheel={stopGlide}
          onTouchStart={stopGlide}
          tabIndex={0}
          className={cn(
            'flex overflow-x-auto snap-x snap-mandatory bg-ivory-deep rounded-xs',
            'overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700',
          )}
        >
          {images.map((img, i) => (
            <div
              key={img.id}
              className="w-full shrink-0 snap-center aspect-[4/5] grid place-items-center"
              aria-label={`${i + 1} of ${count}`}
              role="group"
              aria-roledescription="slide"
            >
              <img
                src={img.url}
                alt={img.altText ?? described}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className={cn(
                  'h-full w-full object-contain',
                  // A photograph leans in by a hair under the pointer — the
                  // closer-look gesture, not a zoom.
                  'transition-[scale] duration-700 motion-safe:group-hover:scale-[1.04]',
                )}
                style={{ transitionTimingFunction: 'var(--ease-couture)' }}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <GalleryArrow
              side="left"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              label="Previous photograph"
            />
            <GalleryArrow
              side="right"
              disabled={index === count - 1}
              onClick={() => goTo(index + 1)}
              label="Next photograph"
            />
            <p
              className="absolute bottom-3 right-3 eyebrow tabular text-ink-muted bg-porcelain/85 px-2 py-1 rounded-xs"
              aria-live="polite"
            >
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </p>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          className={cn(
            'mt-4 flex gap-3 overflow-x-auto pb-1',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              ref={(el) => { thumbRefs.current[i] = el; }}
              onClick={() => goTo(i)}
              aria-label={`Show photograph ${i + 1} of ${count}`}
              aria-current={i === index}
              className={cn(
                'shrink-0 w-16 sm:w-20 aspect-square bg-ivory-deep rounded-xs overflow-hidden',
                'border cursor-pointer transition-[colors,transform] duration-300',
                'motion-safe:hover:-translate-y-0.5',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700',
                i === index ? 'border-gold-700' : 'border-hairline hover:border-ink-muted',
              )}
            >
              <img
                src={img.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Hairline disc, ink glyph — the chrome stays colourless by house rule. */
function GalleryArrow({
  side,
  disabled,
  onClick,
  label,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 grid place-items-center',
        'size-10 rounded-full bg-porcelain/90 border border-hairline text-ink',
        'transition-opacity duration-200 cursor-pointer',
        'hover:bg-porcelain focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700',
        'disabled:opacity-0 disabled:pointer-events-none',
        // Quiet on desktop until the shopper reaches for them; always there on touch.
        'sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      <svg width="9" height="14" viewBox="0 0 9 14" fill="none" aria-hidden="true">
        <path
          d={side === 'left' ? 'M7.5 1 1.5 7l6 6' : 'M1.5 1l6 6-6 6'}
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
