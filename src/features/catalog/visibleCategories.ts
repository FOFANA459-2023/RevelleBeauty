import type { CategoryDTO } from '@contracts/index';

/**
 * A category is shown in navigation only while it has products on sale.
 * Draft products don't count, so hiding a line (Skincare, until it launches)
 * is just setting its products to Draft in the admin — and re-activating
 * them brings the menu link, homepage tile and filter back by themselves.
 * Unknown (still loading) counts as empty, so nothing flashes in and out.
 */
export function hasProducts(categories: CategoryDTO[] | undefined, slug: string): boolean {
  return (categories?.find((c) => c.slug === slug)?.productCount ?? 0) > 0;
}
