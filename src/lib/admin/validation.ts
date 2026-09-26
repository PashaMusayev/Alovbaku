import { localize } from "@/lib/i18n-text";
import { foldForSearch } from "@/lib/search";
import type { MenuData, MenuItem } from "@/lib/types";

/**
 * Data checks shown in the admin menu editor — they catch the kind of mistakes the old
 * menus had (fries at 12,10 ₼, empty descriptions, unnamed variants, 330 ml dearer than 500 ml).
 */
export type MenuWarningKind =
  | "needs_review"
  | "price_outlier"
  | "size_price"
  | "variant_label"
  | "empty_description"
  | "zero_price"
  | "duplicate_name";

export interface MenuWarning {
  itemId: string;
  kind: MenuWarningKind;
  /** Extra data for the message (formatted prices, ratio, note…). */
  params: Record<string, string | number>;
}

export const DEFAULT_OUTLIER_FACTOR = 1.9;
const MIN_ITEMS_FOR_OUTLIER = 3;
const LOW_SIDE_MULTIPLIER = 1.5;

const basePrice = (item: MenuItem) => Math.min(...item.variants.map((v) => v.price));

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const UNIT_FACTORS: Record<string, number> = { ml: 1, l: 1000, sm: 1, "əd": 1, gr: 1, g: 1, kq: 1000 };

/** "330 ml" → { unit: "ml", amount: 330 }; "1 L" → 1000 ml; "6 əd." → 6 pcs; "Böyük · 35 sm" → 35 sm. */
export function parseQuantity(label: string): { unit: string; amount: number } | null {
  const m = /(\d+(?:[.,]\d+)?)\s*(ml|l|sm|əd|gr|g|kq)\b/i.exec(label.toLowerCase());
  if (!m) return null;
  const unit = m[2].toLowerCase();
  const base = unit === "l" ? "ml" : unit === "kq" ? "gr" : unit === "g" ? "gr" : unit;
  return { unit: base, amount: Number(m[1].replace(",", ".")) * (UNIT_FACTORS[unit] ?? 1) };
}

export function validateMenu(menu: MenuData, outlierFactor = DEFAULT_OUTLIER_FACTOR): MenuWarning[] {
  const warnings: MenuWarning[] = [];
  const items = menu.items.filter((i) => i.variants.length > 0);

  for (const item of items) {
    if (item.needsReview) warnings.push({ itemId: item.id, kind: "needs_review", params: { note: item.reviewNote ?? "" } });
    if (!item.isCombo && !item.description.az?.trim()) warnings.push({ itemId: item.id, kind: "empty_description", params: {} });
    if (item.variants.length > 1 && item.variants.some((v) => !v.label?.az?.trim())) {
      warnings.push({ itemId: item.id, kind: "variant_label", params: {} });
    }
    if (item.variants.some((v) => v.price <= 0)) warnings.push({ itemId: item.id, kind: "zero_price", params: {} });

    // Bigger size must not be cheaper than a smaller one.
    const sized = item.variants
      .map((v) => ({ v, q: v.label ? parseQuantity(v.label.az) : null }))
      .filter((x): x is { v: (typeof item.variants)[number]; q: { unit: string; amount: number } } => x.q !== null);
    if (sized.length > 1 && new Set(sized.map((x) => x.q.unit)).size === 1) {
      const byAmount = [...sized].sort((a, b) => a.q.amount - b.q.amount);
      for (let i = 0; i < byAmount.length; i++) {
        for (let j = i + 1; j < byAmount.length; j++) {
          if (byAmount[j].q.amount > byAmount[i].q.amount && byAmount[j].v.price < byAmount[i].v.price) {
            warnings.push({
              itemId: item.id,
              kind: "size_price",
              params: { small: byAmount[i].v.label?.az ?? "", big: byAmount[j].v.label?.az ?? "" },
            });
            i = byAmount.length;
            break;
          }
        }
      }
    }
  }

  // Price far from the rest of its category (leave-one-out median, combos excluded).
  for (const category of menu.categories) {
    const inCategory = items.filter((i) => i.categoryId === category.id && !i.isCombo);
    if (inCategory.length < MIN_ITEMS_FOR_OUTLIER) continue;
    for (const item of inCategory) {
      const others = inCategory.filter((i) => i.id !== item.id).map(basePrice);
      const med = median(others);
      const price = basePrice(item);
      if (med <= 0) continue;
      const ratio = price / med;
      // Cheap sides are normal, so the low side needs a bigger gap (still catches 1,21 vs 12,10 typos).
      if (ratio >= outlierFactor || ratio <= 1 / (outlierFactor * LOW_SIDE_MULTIPLIER)) {
        warnings.push({ itemId: item.id, kind: "price_outlier", params: { price, median: Math.round(med), ratio: Math.round(ratio * 10) / 10 } });
      }
    }
  }

  // Same name twice (e.g. the duplicated "Pendir çubuqları" on the old menu).
  const byName = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = foldForSearch(localize(item.name, "az"));
    byName.set(key, [...(byName.get(key) ?? []), item]);
  }
  for (const group of byName.values()) {
    if (group.length > 1) for (const item of group) warnings.push({ itemId: item.id, kind: "duplicate_name", params: { count: group.length } });
  }

  return warnings;
}
