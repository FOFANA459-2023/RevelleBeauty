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

  // scrollLeft is the single source of truth; rAF-coalesced so a flung swipe
  // does not re-render per frame.
  const ticking = useRef(false);
  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const el = trackRef.current;
      if (!el || el.clientWidth === 0) return;
      setIndex(Math.max(0, Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth))));
    });
  }, [count]);

  const goTo = useCallback((next: number, smooth = true) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(count - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    setIndex(clamped);
  }, [count]);

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
    <div>
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
              className="min-w-full snap-center aspect-[4/5] grid place-items-center"
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
                className="h-full w-full object-contain"
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
                'border cursor-pointer transition-colors duration-200',
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
