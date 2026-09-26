/**
 * Domain types shared by the data layer, server code and (in the public
 * `Public*` shape) by client components.
 *
 * All money values are integers in qəpik (1 ₼ = 100 qəpik) to avoid
 * floating-point rounding errors.
 */

export const LOCALES = ["az", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "az";

/** Text stored per language. Azerbaijani is mandatory, others fall back to it. */
export type LocalizedText = { az: string; ru?: string; en?: string };

export type Channel = "site" | "wolt";

export const ITEM_TAGS = ["spicy", "chicken", "meat", "vegetarian", "seafood"] as const;
export type ItemTag = (typeof ITEM_TAGS)[number];

/** Tags customers can filter by on the menu page. */
export const FILTER_TAGS = ["spicy", "chicken", "meat", "vegetarian"] as const satisfies readonly ItemTag[];
export type FilterTag = (typeof FILTER_TAGS)[number];

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
}

export interface ItemVariant {
  id: string;
  /** Null for single-price items (the only variant is implicit). */
  label: LocalizedText | null;
  priceSite: number;
  /** Null when there is no Wolt price for this variant. */
  priceWolt: number | null;
  sortOrder: number;
  isAvailable: boolean;
}

export interface AddonOption {
  id: string;
  name: LocalizedText;
  priceSite: number;
  priceWolt: number | null;
  /** When set, the option is a menu product (e.g. a drink) and its price follows that variant. */
  linkedVariantId: string | null;
  sortOrder: number;
  isAvailable: boolean;
}

export interface AddonGroup {
  id: string;
  slug: string;
  name: LocalizedText;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: AddonOption[];
}

export interface MenuItem {
  id: string;
  slug: string;
  categoryId: string;
  name: LocalizedText;
  description: LocalizedText;
  imageUrl: string | null;
  tags: ItemTag[];
  isPopular: boolean;
  isNew: boolean;
  isHidden: boolean;
  inStock: boolean;
  availableSite: boolean;
  availableWolt: boolean;
  /** Manual position in "Ən çox sifariş edilənlər" until sales data takes over. */
  featuredRank: number | null;
  sortOrder: number;
  needsReview: boolean;
  reviewNote: string | null;
  isCombo: boolean;
  variants: ItemVariant[];
  addonGroupIds: string[];
}

export type ComboStatus = "active" | "draft" | "archived";

export interface ComboComponent {
  itemId: string;
  /** Null = any variant of the item counts. */
  variantId: string | null;
  quantity: number;
}

export interface Combo {
  id: string;
  /** The orderable menu item that represents this combo (category "Kombolar"). */
  itemId: string;
  status: ComboStatus;
  components: ComboComponent[];
}

export interface OpeningHoursDay {
  /** 0 = Sunday … 6 = Saturday (same as Date.getDay()). */
  day: number;
  /** "HH:MM", 24h. */
  open: string;
  /** "HH:MM". If earlier than or equal to `open`, the shift ends after midnight. */
  close: string;
  closed: boolean;
}

export interface DeliveryZone {
  id: string;
  name: LocalizedText;
  /** Upper bound of the zone, measured from the restaurant. */
  radiusKm: number;
  fee: number;
  minOrder: number;
  etaMinutes: number;
  sortOrder: number;
  isActive: boolean;
}

/** Settings that are safe to expose publicly. */
export interface RestaurantSettings {
  name: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: LocalizedText;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  googleReviewUrl: string;
  timezone: string;
  openingHours: OpeningHoursDay[];
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  preorderEnabled: boolean;
  orderingEnabled: boolean;
  cashbackPercent: number;
  woltBannerEnabled: boolean;
  woltBannerText: LocalizedText;
  heroImageUrl: string | null;
  aiAssistantEnabled: boolean;
  onlinePaymentEnabled: boolean;
}

export interface MenuData {
  categories: Category[];
  items: MenuItem[];
  addonGroups: AddonGroup[];
  combos: Combo[];
}

/* ------------------------------------------------------------------ */
/* Public (localized, channel-filtered) view model sent to the client  */
/* ------------------------------------------------------------------ */

export interface PublicVariant {
  id: string;
  label: string | null;
  price: number;
  /** Only set when the Wolt price is higher than the site price. */
  woltPrice: number | null;
}

export interface PublicAddonOption {
  id: string;
  name: string;
  price: number;
}

export interface PublicAddonGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: PublicAddonOption[];
}

export interface PublicItem {
  id: string;
  slug: string;
  categoryId: string;
  categoryIcon: string;
  name: string;
  description: string;
  imageUrl: string | null;
  tags: ItemTag[];
  isPopular: boolean;
  isNew: boolean;
  inStock: boolean;
  isCombo: boolean;
  featuredRank: number | null;
  variants: PublicVariant[];
  addonGroupIds: string[];
}

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  itemIds: string[];
}

export interface PublicCombo {
  id: string;
  itemId: string;
  components: ComboComponent[];
}

export interface PublicMenu {
  categories: PublicCategory[];
  items: Record<string, PublicItem>;
  addonGroups: Record<string, PublicAddonGroup>;
  combos: PublicCombo[];
  bestsellerIds: string[];
}

export interface PublicDeliveryZone {
  id: string;
  name: string;
  radiusKm: number;
  fee: number;
  minOrder: number;
  etaMinutes: number;
}

export interface PublicSettings {
  name: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  timezone: string;
  openingHours: OpeningHoursDay[];
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  preorderEnabled: boolean;
  orderingEnabled: boolean;
  cashbackPercent: number;
  heroImageUrl: string | null;
  zones: PublicDeliveryZone[];
}
