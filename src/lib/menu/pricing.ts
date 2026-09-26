import type { PublicAddonGroup, PublicItem } from "@/lib/types";

export interface LineSelection {
  itemId: string;
  variantId: string;
  addonIds: string[];
  quantity: number;
}

export type SelectionError = "unknown_item" | "out_of_stock" | "unknown_variant" | "unknown_addon" | "addon_limit";

export interface PricedLine {
  unitPrice: number;
  lineTotal: number;
}

/**
 * Validates a selection against the menu and returns its price.
 * Used for display on the client and (with the same rules) on the server.
 */
export function priceSelection(
  sel: LineSelection,
  items: Record<string, PublicItem>,
  groups: Record<string, PublicAddonGroup>,
): PricedLine | { error: SelectionError } {
  const item = items[sel.itemId];
  if (!item) return { error: "unknown_item" };
  if (!item.inStock) return { error: "out_of_stock" };
  const variant = item.variants.find((v) => v.id === sel.variantId);
  if (!variant) return { error: "unknown_variant" };

  let addonsTotal = 0;
  const countByGroup = new Map<string, number>();
  for (const addonId of new Set(sel.addonIds)) {
    const group = item.addonGroupIds.map((g) => groups[g]).find((g) => g?.options.some((o) => o.id === addonId));
    const option = group?.options.find((o) => o.id === addonId);
    if (!group || !option) return { error: "unknown_addon" };
    const count = (countByGroup.get(group.id) ?? 0) + 1;
    if (count > group.maxSelect) return { error: "addon_limit" };
    countByGroup.set(group.id, count);
    addonsTotal += option.price;
  }
  for (const gid of item.addonGroupIds) {
    const g = groups[gid];
    if (g && (countByGroup.get(gid) ?? 0) < g.minSelect) return { error: "addon_limit" };
  }

  const quantity = Math.max(1, Math.floor(sel.quantity));
  const unitPrice = variant.price + addonsTotal;
  return { unitPrice, lineTotal: unitPrice * quantity };
}

/** Cheapest variant price — shown as "from" on cards. */
export function fromPrice(item: PublicItem): number {
  return Math.min(...item.variants.map((v) => v.price));
}
