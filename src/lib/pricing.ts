import type { MenuItem, OptionGroup, Qepik } from "./types";

export type SelectionError =
  | "item_unavailable"
  | "variant_missing"
  | "option_invalid"
  | "option_group_min"
  | "option_group_max";

export type UnitPriceResult =
  | { ok: true; unitPrice: Qepik }
  | { ok: false; error: SelectionError };

/**
 * Validates a selection (variant + options) against the menu and returns the
 * unit price in qəpik. Used by the item sheet for display AND by the server
 * when an order is submitted — the server never trusts client prices.
 */
export function computeUnitPrice(
  item: MenuItem,
  variantId: string,
  optionIds: string[],
  groups: OptionGroup[],
): UnitPriceResult {
  if (!item.inStock || !item.availableSite || item.isHidden || item.isDraft) {
    return { ok: false, error: "item_unavailable" };
  }
  const variant = item.variants.find((v) => v.id === variantId && v.availableSite);
  if (!variant) return { ok: false, error: "variant_missing" };

  const itemGroups = groups.filter((g) => item.optionGroupIds.includes(g.id));
  const unique = new Set(optionIds);
  if (unique.size !== optionIds.length) return { ok: false, error: "option_invalid" };

  let total = variant.priceSite;
  const perGroup = new Map<string, number>();
  for (const id of unique) {
    const group = itemGroups.find((g) => g.options.some((o) => o.id === id));
    const option = group?.options.find((o) => o.id === id);
    if (!group || !option || !option.isAvailable) return { ok: false, error: "option_invalid" };
    perGroup.set(group.id, (perGroup.get(group.id) ?? 0) + 1);
    total += option.priceDelta;
  }
  for (const g of itemGroups) {
    const n = perGroup.get(g.id) ?? 0;
    if (n < g.minSelect) return { ok: false, error: "option_group_min" };
    if (n > g.maxSelect) return { ok: false, error: "option_group_max" };
  }
  return { ok: true, unitPrice: total };
}

/** Stable key so identical selections merge into one cart line. */
export function lineKey(itemId: string, variantId: string, optionIds: string[]): string {
  return [itemId, variantId, ...[...optionIds].sort()].join("|");
}
