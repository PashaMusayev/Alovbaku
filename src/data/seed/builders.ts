import { azn } from "@/lib/money";
import type {
  Category,
  ComboComponent,
  DietTag,
  FoodArt,
  LocalizedText,
  MenuItem,
  Variant,
} from "@/lib/types";

/**
 * Compact helpers for writing seed data by hand. Prices are written in
 * manat (4.1) and converted to qəpik here.
 */

export type L = LocalizedText;

/** A variant row: [label, site price, wolt price?]. Wolt defaults to site; null = not on Wolt. */
export type VariantSpec = [label: L | string, site: number, wolt?: number | null];

export interface VariantOverride {
  needsReview?: boolean;
  reviewNote?: string;
  availableSite?: boolean;
}

export interface ItemSpec {
  slug: string;
  name: L;
  description?: L;
  art?: FoodArt;
  variantLabel?: L;
  /** Single price: number = same on both channels. */
  price?: number | { site: number; wolt: number | null };
  variants?: VariantSpec[];
  variantOverrides?: Record<number, VariantOverride>;
  /** Default "both". "site" = only on our website (not listed on Wolt). */
  channels?: "both" | "site" | "wolt";
  options?: string[];
  diet?: DietTag[];
  spicy?: boolean;
  popular?: boolean;
  isNew?: boolean;
  bestsellerRank?: number;
  review?: string;
  draft?: boolean;
  combo?: Array<{ item?: string; variant?: number; qty?: number; label: L }>;
}

export function category(
  slug: string,
  name: L,
  role: Category["role"],
  art: FoodArt,
  sortOrder: number,
): Category {
  return { id: slug, slug, name, role, art, sortOrder, isVisible: true };
}

const labelOf = (l: L | string): L => (typeof l === "string" ? { az: l } : l);

export function buildItems(cat: Category, specs: ItemSpec[]): MenuItem[] {
  return specs.map((s, index) => {
    const channels = s.channels ?? "both";
    const onSite = channels !== "wolt";
    const onWolt = channels !== "site";

    let variantSpecs: VariantSpec[];
    if (s.variants) variantSpecs = s.variants;
    else if (typeof s.price === "number") variantSpecs = [["", s.price]];
    else if (s.price) variantSpecs = [["", s.price.site, s.price.wolt]];
    else throw new Error(`Seed item ${s.slug} has no price`);

    const variants: Variant[] = variantSpecs.map(([label, site, wolt], i) => {
      const woltPrice = !onWolt ? null : wolt === undefined ? site : wolt;
      const o = s.variantOverrides?.[i] ?? {};
      return {
        id: `${s.slug}-v${i + 1}`,
        label: labelOf(label),
        priceSite: azn(site),
        priceWolt: woltPrice === null ? null : azn(woltPrice),
        availableSite: o.availableSite ?? onSite,
        availableWolt: woltPrice !== null,
        sortOrder: i,
        needsReview: o.needsReview ?? false,
        reviewNote: o.reviewNote ?? null,
      };
    });

    const comboComponents: ComboComponent[] = (s.combo ?? []).map((c, i) => ({
      id: `${s.slug}-c${i + 1}`,
      itemId: c.item ?? null,
      variantId: c.item && c.variant ? `${c.item}-v${c.variant}` : null,
      quantity: c.qty ?? 1,
      label: c.label,
    }));

    const needsReview = !!s.review || variants.some((v) => v.needsReview);

    return {
      id: s.slug,
      categoryId: cat.id,
      slug: s.slug,
      name: s.name,
      description: s.description ?? null,
      imageUrl: null,
      art: s.art ?? cat.art,
      variantLabel: s.variantLabel ?? null,
      variants,
      optionGroupIds: s.options ?? [],
      availableSite: onSite,
      availableWolt: onWolt && variants.some((v) => v.availableWolt),
      inStock: true,
      isHidden: !!s.draft,
      isDraft: !!s.draft,
      isPopular: !!s.popular,
      isNew: !!s.isNew,
      isSpicy: !!s.spicy,
      dietTags: s.diet ?? [],
      bestsellerRank: s.bestsellerRank ?? null,
      sortOrder: index,
      needsReview,
      reviewNote: s.review ?? null,
      isCombo: !!s.combo,
      comboComponents,
    };
  });
}
