/** Shade color utilities. All hexes are lowercase #rrggbb (server-normalized). */

export function isValidHex(s: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(s);
}

/** Normalize user input: trim, prepend #, expand #abc, lowercase. */
export function normalizeHex(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return /^#[0-9a-f]{6}$/.test(s) ? s : null;
}

export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const chan = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * chan((n >> 16) & 255) +
    0.7152 * chan((n >> 8) & 255) +
    0.0722 * chan(n & 255)
  );
}

/** Very light shades get a truthful "renders with a darker outline" note. */
export function isPaleShade(hex: string): boolean {
  return relativeLuminance(hex) > 0.82;
}

/**
 * Beauty-vocabulary color anchors for describeShadeColor. Curated for the
 * catalog's territory (lips, cheeks, neutrals) with enough off-palette
 * anchors (greens, blues) that arbitrary hexes still get a sane name.
 */
const COLOR_NAMES: ReadonlyArray<readonly [string, string]> = [
  ['#ffffff', 'White'],
  ['#fdf6ec', 'Ivory'],
  ['#f5ead9', 'Cream'],
  ['#efdcc3', 'Champagne'],
  ['#e8c9a0', 'Sand'],
  ['#dbb283', 'Honey'],
  ['#c9a17c', 'Caramel'],
  ['#bb8f76', 'Nude Beige'],
  ['#a97c5f', 'Warm Taupe'],
  ['#8b6248', 'Toffee'],
  ['#6f4a30', 'Chocolate'],
  ['#4e3222', 'Espresso'],
  ['#f7d1cd', 'Baby Pink'],
  ['#f4b8c1', 'Blush Pink'],
  ['#ec9ba6', 'Soft Rose'],
  ['#d9738a', 'Rose Pink'],
  ['#c96f85', 'Dusty Rose'],
  ['#e2568b', 'Hot Pink'],
  ['#d23c77', 'Fuchsia'],
  ['#b03060', 'Magenta Rose'],
  ['#c98a86', 'Rosewood'],
  ['#b76e79', 'Rose Gold'],
  ['#a05a5a', 'Mauve Brown'],
  ['#9d7a8f', 'Mauve'],
  ['#8a5a83', 'Orchid'],
  ['#f2a48d', 'Peach'],
  ['#ee8262', 'Coral'],
  ['#e2725b', 'Terracotta'],
  ['#a55340', 'Rust'],
  ['#b7410e', 'Brick'],
  ['#ff7f24', 'Tangerine'],
  ['#e25822', 'Flame Orange'],
  ['#e0115f', 'Ruby'],
  ['#d10047', 'Raspberry'],
  ['#b31b2c', 'Classic Red'],
  ['#a4161a', 'Crimson'],
  ['#8d021f', 'Cherry Red'],
  ['#722f37', 'Wine'],
  ['#5e2129', 'Burgundy'],
  ['#6d2740', 'Deep Berry'],
  ['#580f41', 'Plum'],
  ['#3b1c32', 'Blackberry'],
  ['#7851a9', 'Violet'],
  ['#b57edc', 'Lavender'],
  ['#4b0082', 'Deep Purple'],
  ['#ffd700', 'Gold'],
  ['#daa520', 'Antique Gold'],
  ['#b8860b', 'Bronze'],
  ['#b87333', 'Copper'],
  ['#c0c0c0', 'Silver'],
  ['#9a9a9a', 'Gray'],
  ['#5c5c5c', 'Charcoal'],
  ['#1c1c1c', 'Black'],
  ['#98ff98', 'Mint'],
  ['#3cb371', 'Green'],
  ['#556b2f', 'Olive'],
  ['#008080', 'Teal'],
  ['#87ceeb', 'Sky Blue'],
  ['#4169e1', 'Blue'],
  ['#191970', 'Navy'],
];

/**
 * Human-friendly name for a hex — merchandisers should never have to read
 * "#a55340" and guess. Nearest anchor by redmean-weighted RGB distance.
 */
export function describeShadeColor(hex: string): string {
  if (!isValidHex(hex)) return '';
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;

  let best = '';
  let bestDist = Infinity;
  for (const [anchor, name] of COLOR_NAMES) {
    const m = parseInt(anchor.slice(1), 16);
    const ar = (m >> 16) & 255;
    const ag = (m >> 8) & 255;
    const ab = m & 255;
    const rMean = (r + ar) / 2;
    const dr = r - ar;
    const dg = g - ag;
    const db = b - ab;
    const dist =
      (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

/** Hue angle for sorting the /shades library. */
export function hueAngle(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
