import type { MenuData, MenuItem } from "@/lib/types";

/**
 * Filters a full menu down to what customers may see on the website:
 * visible categories, published site items and site-available variants.
 * Mirrors the RLS policies so demo mode behaves like production.
 */
export function toPublicMenu(menu: MenuData): MenuData {
  const categories = menu.categories
    .filter((c) => c.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const visibleCats = new Set(categories.map((c) => c.id));

  const items = menu.items
    .filter((i) => visibleCats.has(i.categoryId) && i.availableSite && !i.isHidden && !i.isDraft)
    .map((i) => ({ ...i, variants: i.variants.filter((v) => v.availableSite) }))
    .filter((i) => i.variants.length > 0);

  const usedGroups = new Set(items.flatMap((i) => i.optionGroupIds));
  const optionGroups = menu.optionGroups.filter((g) => usedGroups.has(g.id));
  return { categories, items, optionGroups };
}

/** Lowest site price among an item's variants (for "from X ₼"). */
export function minSitePrice(item: MenuItem): number {
  return Math.min(...item.variants.map((v) => v.priceSite));
}

export function bestsellers(items: MenuItem[], limit = 8): MenuItem[] {
  return items
    .filter((i) => i.bestsellerRank !== null)
    .sort((a, b) => (a.bestsellerRank ?? 0) - (b.bestsellerRank ?? 0))
    .slice(0, limit);
}

/**
 * The Wolt price to show struck through on a card: only when every compared
 * variant is cheaper on the site and the data is confirmed (not flagged).
 * Returns the Wolt price of the cheapest site variant, or null.
 */
export function woltStrikePrice(item: MenuItem): number | null {
  if (item.needsReview || !item.availableWolt) return null;
  const cheapest = [...item.variants].sort((a, b) => a.priceSite - b.priceSite)[0];
  if (!cheapest || cheapest.needsReview || cheapest.priceWolt === null) return null;
  return cheapest.priceWolt > cheapest.priceSite ? cheapest.priceWolt : null;
}

/** Number of confirmed items that are cheaper on the site than on Wolt. */
export function countCheaperThanWolt(items: MenuItem[]): number {
  return items.filter((i) => woltStrikePrice(i) !== null).length;
}
