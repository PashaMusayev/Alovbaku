import type {
  Category,
  ComboComponent,
  DeliveryZone,
  DietTag,
  FoodArt,
  LocalizedText,
  MenuItem,
  OptionChoice,
  OptionGroup,
  Promotion,
  Variant,
} from "@/lib/types";

/* Row shapes as returned by Supabase (snake_case). */
export interface CategoryRow {
  id: string;
  slug: string;
  name: LocalizedText;
  role: Category["role"];
  art: string;
  sort_order: number;
  is_visible: boolean;
}

export interface VariantRow {
  id: string;
  item_id: string;
  label: LocalizedText;
  price_site: number;
  price_wolt: number | null;
  available_site: boolean;
  available_wolt: boolean;
  sort_order: number;
  needs_review: boolean;
  review_note: string | null;
}

export interface ComboComponentRow {
  id: string;
  combo_item_id: string;
  component_item_id: string | null;
  component_variant_id: string | null;
  quantity: number;
  label: LocalizedText;
  sort_order: number;
}

export interface ItemRow {
  id: string;
  category_id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  image_url: string | null;
  art: string;
  variant_label: LocalizedText | null;
  available_site: boolean;
  available_wolt: boolean;
  in_stock: boolean;
  is_hidden: boolean;
  is_draft: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_spicy: boolean;
  diet_tags: string[];
  bestseller_rank: number | null;
  sort_order: number;
  needs_review: boolean;
  review_note: string | null;
  is_combo: boolean;
  item_variants?: VariantRow[];
  item_option_groups?: { group_id: string; sort_order: number }[];
  combo_components?: ComboComponentRow[];
}

export interface OptionRow {
  id: string;
  group_id: string;
  name: LocalizedText;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
}

export interface OptionGroupRow {
  id: string;
  name: LocalizedText;
  min_select: number;
  max_select: number;
  sort_order: number;
  needs_review: boolean;
  options?: OptionRow[];
}

export interface ZoneRow {
  id: string;
  name: LocalizedText;
  radius_km: number | string;
  fee: number;
  min_order: number;
  free_from: number | null;
  sort_order: number;
  is_active: boolean;
}

export interface PromotionRow {
  id: string;
  title: LocalizedText;
  body: LocalizedText | null;
  image_url: string | null;
  href: string | null;
  is_active: boolean;
  sort_order: number;
}

const bySort = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

export const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  role: r.role,
  art: r.art as FoodArt,
  sortOrder: r.sort_order,
  isVisible: r.is_visible,
});

export const toVariant = (r: VariantRow): Variant => ({
  id: r.id,
  label: r.label ?? { az: "" },
  priceSite: r.price_site,
  priceWolt: r.price_wolt,
  availableSite: r.available_site,
  availableWolt: r.available_wolt,
  sortOrder: r.sort_order,
  needsReview: r.needs_review,
  reviewNote: r.review_note,
});

const toComboComponent = (r: ComboComponentRow): ComboComponent => ({
  id: r.id,
  itemId: r.component_item_id,
  variantId: r.component_variant_id,
  quantity: r.quantity,
  label: r.label,
});

export const toItem = (r: ItemRow): MenuItem => ({
  id: r.id,
  categoryId: r.category_id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  imageUrl: r.image_url,
  art: r.art as FoodArt,
  variantLabel: r.variant_label,
  variants: (r.item_variants ?? []).map(toVariant).sort(bySort),
  optionGroupIds: [...(r.item_option_groups ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((g) => g.group_id),
  availableSite: r.available_site,
  availableWolt: r.available_wolt,
  inStock: r.in_stock,
  isHidden: r.is_hidden,
  isDraft: r.is_draft,
  isPopular: r.is_popular,
  isNew: r.is_new,
  isSpicy: r.is_spicy,
  dietTags: r.diet_tags as DietTag[],
  bestsellerRank: r.bestseller_rank,
  sortOrder: r.sort_order,
  needsReview: r.needs_review,
  reviewNote: r.review_note,
  isCombo: r.is_combo,
  comboComponents: [...(r.combo_components ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(toComboComponent),
});

const toOption = (r: OptionRow): OptionChoice => ({
  id: r.id,
  name: r.name,
  priceDelta: r.price_delta,
  isAvailable: r.is_available,
  sortOrder: r.sort_order,
});

export const toOptionGroup = (r: OptionGroupRow): OptionGroup => ({
  id: r.id,
  name: r.name,
  minSelect: r.min_select,
  maxSelect: r.max_select,
  sortOrder: r.sort_order,
  needsReview: r.needs_review,
  options: (r.options ?? []).map(toOption).sort(bySort),
});

export const toZone = (r: ZoneRow): DeliveryZone => ({
  id: r.id,
  name: r.name,
  radiusKm: Number(r.radius_km),
  fee: r.fee,
  minOrder: r.min_order,
  freeFrom: r.free_from,
  sortOrder: r.sort_order,
  isActive: r.is_active,
});

export const toPromotion = (r: PromotionRow): Promotion => ({
  id: r.id,
  title: r.title,
  body: r.body,
  imageUrl: r.image_url,
  href: r.href,
  isActive: r.is_active,
  sortOrder: r.sort_order,
});
