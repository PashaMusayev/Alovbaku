import type { PublicItem, PublicMenu } from "@/lib/types";
import type { CartLine } from "./store";

/** Categories whose items count as a "main dish" that deserves a side/drink suggestion. */
const MAIN_CATEGORY_SLUGS = new Set([
  "et-doner",
  "toyuq-doner",
  "kabablar",
  "saurmalar",
  "pizzalar",
  "burgerler",
  "lahmacunlar",
  "pideler",
  "hot-rolls",
]);
const DRINK_CATEGORY_SLUG = "ickiler";
/** Suggestions in priority order: a drink first, then fries. */
const SUGGESTION_SLUGS = ["ayran", "kartof-fri"];

function categorySlug(menu: PublicMenu, item: PublicItem): string | undefined {
  return menu.categories.find((c) => c.id === item.categoryId)?.slug;
}

/**
 * After a main dish is added, suggest one cheap single-price extra the cart lacks
 * (e.g. "Ayran əlavə edək? +1,10 ₼").
 */
export function pickUpsell(addedItemId: string, lines: CartLine[], menu: PublicMenu): PublicItem | null {
  const added = menu.items[addedItemId];
  if (!added || added.isCombo || !MAIN_CATEGORY_SLUGS.has(categorySlug(menu, added) ?? "")) return null;

  const inCart = new Set(lines.map((l) => l.itemId));
  const hasDrink = lines.some((l) => {
    const item = menu.items[l.itemId];
    return item && categorySlug(menu, item) === DRINK_CATEGORY_SLUG;
  });

  for (const slug of SUGGESTION_SLUGS) {
    const item = Object.values(menu.items).find((i) => i.slug === slug);
    if (!item || !item.inStock || inCart.has(item.id) || item.variants.length !== 1) continue;
    if (hasDrink && categorySlug(menu, item) === DRINK_CATEGORY_SLUG) continue;
    return item;
  }
  return null;
}
