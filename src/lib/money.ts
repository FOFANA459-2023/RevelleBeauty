/** Money is integer cents everywhere; formatting happens only here. */
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** "$18–$24" when variants have price overrides, single price otherwise. */
export function formatPriceRange(minCents: number, maxCents: number): string {
  if (minCents === maxCents) return formatCents(minCents);
  return `${formatCents(minCents)}–${formatCents(maxCents)}`;
}
