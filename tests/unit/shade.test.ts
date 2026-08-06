import { describe, expect, it } from 'vitest';
import { hueAngle, isPaleShade, normalizeHex, relativeLuminance } from '@/lib/shade';

describe('normalizeHex', () => {
  it('lowercases and prefixes', () => {
    expect(normalizeHex('D9738A')).toBe('#d9738a');
    expect(normalizeHex('#D9738A')).toBe('#d9738a');
  });

  it('expands 3-digit shorthand', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc');
  });

  it('rejects garbage', () => {
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('')).toBeNull();
  });
});

describe('pale-shade detection (drives the auto-outline swatch ring)', () => {
  it('flags near-white glosses', () => {
    expect(isPaleShade('#f6ece4')).toBe(true); // Clear Glaze
    expect(isPaleShade('#f3ebe6')).toBe(true); // Hydra Clear
  });

  it('does not flag saturated shades', () => {
    expect(isPaleShade('#b31b2c')).toBe(false); // Classic Red
    expect(isPaleShade('#6d2740')).toBe(false); // Deep Berry
  });
});

describe('relativeLuminance', () => {
  it('orders black < mid < white', () => {
    const black = relativeLuminance('#000000');
    const mid = relativeLuminance('#b31b2c');
    const white = relativeLuminance('#ffffff');
    expect(black).toBeLessThan(mid);
    expect(mid).toBeLessThan(white);
    expect(white).toBeCloseTo(1, 5);
  });
});

describe('hueAngle (sorts the /shades library)', () => {
  it('puts reds in the red band (near 0°, wrapping through 360°)', () => {
    const red = hueAngle('#b31b2c');
    expect(red).toBeGreaterThanOrEqual(0);
    expect(red).toBeLessThan(360);
    const distanceFromZero = Math.min(red, 360 - red);
    expect(distanceFromZero).toBeLessThan(60);
  });

  it('is stable for grays', () => {
    expect(hueAngle('#808080')).toBe(0);
  });
});
