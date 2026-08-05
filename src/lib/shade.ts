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
