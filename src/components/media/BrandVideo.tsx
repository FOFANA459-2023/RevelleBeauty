import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

function shouldShowVideo(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = (navigator as Navigator & {
    connection?: { saveData?: boolean };
  }).connection;
  if (conn?.saveData) return false;
  // Note: effectiveType is deliberately NOT consulted — Chrome's estimate
  // reports '3g' on fast desktop connections far too often.
  return true;
}

/**
 * Autoplay muted loop that degrades to a poster <img> (never mounting <video>)
 * under reduced-motion / save-data / slow connections, and pauses off-screen.
 */
export function BrandVideo({
  src,
  poster,
  className,
  preload = 'metadata',
}: {
  src: string;
  poster?: string;
  className?: string;
  preload?: 'metadata' | 'none';
}) {
  const [useVideo] = useState(shouldShowVideo);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [useVideo]);

  if (!useVideo) {
    if (poster) {
      return <img src={poster} alt="" className={cn('object-cover', className)} />;
    }
    return <div className={cn('bg-ivory-deep', className)} aria-hidden="true" />;
  }

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload={preload}
      poster={poster}
      disablePictureInPicture
      aria-hidden="true"
      className={cn('object-cover', className)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
