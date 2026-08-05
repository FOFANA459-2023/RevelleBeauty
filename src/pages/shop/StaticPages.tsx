import { Link } from 'react-router';
import { GoldRule } from '@/components/brand/GoldRule';
import { Sparkle } from '@/components/brand/Sparkle';
import campaignImage from '@/assets/revelle-campaign.jpg';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-gutter py-16">
      <p className="eyebrow text-gold-950 text-center">Our story</p>
      <h1 className="display text-display-2 text-ink mt-4 text-center">
        Be you. Be bold. Be Revelle.
      </h1>
      <GoldRule ornament className="w-44 mt-8 mx-auto" />
      <img
        src={campaignImage}
        alt="Revelle Beauty campaign"
        className="mt-12 rounded-xs w-full max-w-xl mx-auto shadow-[var(--shadow-lift)]"
      />
      <div className="mt-12 space-y-6 text-body-lg text-ink-soft">
        <p>
          Revelle Beauty began with a simple conviction: your color should be
          the loudest thing about your beauty routine — not the packaging, not
          the noise, not the trends.
        </p>
        <p>
          That's why everything we make is designed around the shade itself.
          Nourishing lip oils, weightless mattes, and glass-like glosses, each
          in colors chosen to flatter and formulated to care for your lips as
          much as they color them.
        </p>
        <p>
          White, ivory, and gold — that's us. The color is yours.
        </p>
      </div>
    </div>
  );
}

export function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-gutter py-16 text-center">
      <p className="eyebrow text-gold-950">Get in touch</p>
      <h1 className="display text-display-2 text-ink mt-4">Contact</h1>
      <GoldRule ornament className="w-44 mt-8 mx-auto" />
      <div className="mt-12 space-y-8">
        <div>
          <p className="eyebrow text-ink-muted">Customer care</p>
          <a href="mailto:hello@revellebeauty.com" className="mt-2 inline-block text-body-lg text-ink link-ink">
            hello@revellebeauty.com
          </a>
        </div>
        <div>
          <p className="eyebrow text-ink-muted">Follow along</p>
          <p className="mt-2 text-body text-ink-soft">@revellebeauty</p>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="py-32 text-center px-gutter">
      <Sparkle size={28} className="text-gold-300" />
      <h1 className="mt-6 display text-display-2 text-ink">Lost your shade?</h1>
      <p className="mt-4 text-body text-ink-muted">This page doesn't exist.</p>
      <Link to="/" className="mt-8 inline-block text-sm text-ink link-ink">
        Return to the collection
      </Link>
    </div>
  );
}
