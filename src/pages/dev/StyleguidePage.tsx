import { ShadeSwatch } from '@/components/shade/ShadeSwatch';
import { ShadeBar } from '@/components/shade/ShadeBar';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/brand/GoldRule';
import { Wordmark } from '@/components/brand/Wordmark';

/** Dev-only regression surface: every token, treatment, and swatch case. */

const COLORS = [
  ['porcelain', '#FFFFFF', '—'],
  ['ivory', '#FBF3E6', '—'],
  ['ivory-deep', '#F4E9D7', '—'],
  ['hairline', '#E7DDCB', '—'],
  ['ink', '#14110E', '18.81 / 17.08'],
  ['ink-soft', '#4A423A', '9.85 / 8.94'],
  ['ink-muted', '#6E645A', '5.78 / 5.25'],
  ['gold-950', '#6C4F27', '7.54 / 6.84 — AAA text'],
  ['gold-800', '#9A6E1F', '4.54 / 4.12 — AA on WHITE only'],
  ['gold-700', '#AF7F2B', '3.56 / 3.23 — UI + display >=24px'],
  ['gold-500', '#CFA456', '2.31 — DECORATIVE ONLY'],
  ['gold-300', '#E8CE94', '1.53 — decorative'],
  ['gold-50', '#FFF5DF', 'shimmer stop'],
] as const;

const TEST_SHADES = [
  ['Pale Nude', '#f6ece4'],
  ['Bare Ivory', '#f2e6da'],
  ['Champagne', '#e2c391'],
  ['Peach', '#f0a882'],
  ['Petal', '#e79aa4'],
  ['Rose', '#d9738a'],
  ['Coral', '#e2745c'],
  ['Classic Red', '#b31b2c'],
  ['Cherry', '#b03246'],
  ['Berry', '#8e3a5a'],
  ['Deep Plum', '#6f3149'],
  ['Cocoa', '#6f4436'],
] as const;

export function StyleguidePage() {
  return (
    <div className="mx-auto max-w-5xl px-gutter py-16 space-y-20">
      <header>
        <h1 className="display text-display-2 text-ink">Styleguide</h1>
        <p className="text-sm text-ink-muted mt-2">Dev-only. Every token and treatment, reviewable at a glance.</p>
      </header>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">Wordmark</h2>
        <div className="flex flex-wrap items-end gap-12">
          <Wordmark variant="ink" size="lg" />
          <Wordmark variant="metal" size="lg" />
          <span className="bg-ink p-6 rounded-xs"><Wordmark variant="reverse" size="lg" /></span>
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">Color tokens (contrast on white / ivory)</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {COLORS.map(([name, hex, contrast]) => (
            <div key={name} className="flex items-center gap-4 bg-porcelain border border-hairline rounded-xs p-3">
              <span className="w-10 h-10 rounded-xs border border-hairline shrink-0" style={{ background: hex }} />
              <div className="min-w-0">
                <p className="text-sm text-ink">{name} <span className="text-ink-muted tabular">{hex}</span></p>
                <p className="text-xs text-ink-muted">{contrast}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">Type scale</h2>
        <div className="space-y-4">
          <p className="display text-display-1 text-ink">Display 1</p>
          <p className="display text-display-2 text-ink">Display 2</p>
          <p className="display text-h1 text-ink">Heading 1</p>
          <p className="shade-name text-h3 text-ink">Shade Name Italic — the only italic</p>
          <p className="eyebrow text-ink">Eyebrow letterspaced label</p>
          <p className="text-body text-ink-soft">Body — Jost 400. The quick brown fox jumps over the lazy dog.</p>
          <p className="tabular text-ink">$24.00 · 1,234 units · tabular numerals</p>
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">Buttons (one metal per viewport)</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="metal">Add to bag — $24.00</Button>
          <Button variant="solid">Solid ink</Button>
          <Button variant="outline">Outline metallic</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="metal" disabled>Disabled</Button>
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">Metal treatments</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <p className="metal-text display text-h1">Metallic Text</p>
          <div className="metal-border rounded-xs p-6 text-sm text-ink">.metal-border card</div>
          <div className="metal-ring rounded-xs bg-ivory-deep p-6 text-sm text-ink">.metal-ring over content</div>
          <div className="metal-surface metal-sheen rounded-xs p-6 text-sm">.metal-surface + hover sheen</div>
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">
          Shade swatches — pale nude to deep plum, on white and ivory
        </h2>
        <div className="bg-porcelain border border-hairline rounded-xs p-8 flex flex-wrap gap-4">
          {TEST_SHADES.map(([name, hex]) => (
            <ShadeSwatch key={name} hex={hex} name={name} interactive={false} />
          ))}
        </div>
        <div className="bg-ivory border border-hairline rounded-xs p-8 flex flex-wrap gap-4 mt-3">
          {TEST_SHADES.map(([name, hex]) => (
            <ShadeSwatch key={name} hex={hex} name={name} interactive={false} />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-6 items-center bg-porcelain border border-hairline rounded-xs p-8">
          <ShadeSwatch hex="#d9738a" name="selected" selected interactive={false} />
          <ShadeSwatch hex="#d9738a" name="sold out" soldOut aria-disabled="true" interactive={false} />
          <ShadeSwatch hex="#efe7e2" hexSecondary="#d8c39a" name="duochrome" interactive={false} />
          <ShadeSwatch hex="#c9a24a" hexSecondary="#f0dfae" name="gold dust duo" interactive={false} />
        </div>
        <div className="mt-6">
          <ShadeBar hex="#b03246" />
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-ink-muted mb-6">Rules & skeleton</h2>
        <GoldRule className="mb-4" />
        <GoldRule ornament className="mb-6" />
        <div className="flex gap-4">
          <div className="skeleton h-24 w-40" />
          <div className="skeleton h-24 flex-1" />
        </div>
      </section>
    </div>
  );
}
