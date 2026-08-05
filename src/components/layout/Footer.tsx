import { Link } from 'react-router';
import { Wordmark } from '@/components/brand/Wordmark';
import { GoldRule } from '@/components/brand/GoldRule';

export function Footer() {
  return (
    <footer className="bg-porcelain border-t border-hairline mt-section">
      <div className="mx-auto max-w-[1440px] px-gutter py-14">
        <div className="flex flex-col items-center text-center gap-6">
          <Wordmark variant="ink" size="md" />
          <p className="eyebrow text-ink-muted">Be you. Be bold. Be Revelle.</p>
          <GoldRule ornament className="w-40" />
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2" aria-label="Footer">
            <Link to="/shop" className="text-sm text-ink-soft link-ink">Shop</Link>
            <Link to="/shades" className="text-sm text-ink-soft link-ink">Shade library</Link>
            <Link to="/about" className="text-sm text-ink-soft link-ink">About</Link>
            <Link to="/contact" className="text-sm text-ink-soft link-ink">Contact</Link>
          </nav>
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} Revelle Beauty. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
