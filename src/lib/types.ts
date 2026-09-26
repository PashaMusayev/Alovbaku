import type { Locale } from "@/i18n/config";

/** Translatable DB text. Azerbaijani is mandatory; others fall back to it. */
export type LocalizedText = { az: string } & Partial<Record<Exclude<Locale, "az">, string>>;

/** Money is always stored as integer qəpik (1 ₼ = 100 qəpik). */
export type Qepik = number;

export type Channel = "site" | "wolt";

export type DietTag = "meat" | "chicken" | "vegetarian" | "fish";

/** Drives placeholder artwork until a real photo is uploaded. */
export type FoodArt =
  | "doner"
  | "kebab"
  | "pizza"
  | "shawarma"
  | "burger"
  | "lahmacun"
  | "pide"
  | "roll"
  | "fries"
  | "snack"
  | "salad"
  | "soup"
  | "drink"
  | "combo";

/** Category role is used by the upsell engine (main → suggest side/drink). */
export type CategoryRole = "main" | "side" | "drink" | "combo";

export interface Category {
  id: string;
  slug: string;
  name: LocalizedText;
  role: CategoryRole;
  art: FoodArt;
  sortOrder: number;
  isVisible: boolean;
}

export interface Variant {
  id: string;
  /** Empty `az` label is allowed only when the item has a single variant. */
  label: LocalizedText;
  priceSite: Qepik;
  priceWolt: Qepik | null;
  availableSite: boolean;
  availableWolt: boolean;
  sortOrder: number;
  needsReview: boolean;
  reviewNote: string | null;
}

export interface OptionChoice {
  id: string;
  name: LocalizedText;
  priceDelta: Qepik;
  isAvailable: boolean;
  sortOrder: number;
}

export interface OptionGroup {
  id: string;
  name: LocalizedText;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  needsReview: boolean;
  options: OptionChoice[];
}

export interface ComboComponent {
  id: string;
  itemId: string | null;
  variantId: string | null;
  quantity: number;
  /** Display label, used when the component is not linked to a menu item. */
  label: LocalizedText;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  imageUrl: string | null;
  art: FoodArt;
  /** Heading for the variant chips, e.g. "Ölçü" or "Çörək növü". */
  variantLabel: LocalizedText | null;
  variants: Variant[];
  optionGroupIds: string[];
  availableSite: boolean;
  availableWolt: boolean;
  inStock: boolean;
  isHidden: boolean;
  isDraft: boolean;
  isPopular: boolean;
  isNew: boolean;
  isSpicy: boolean;
  dietTags: DietTag[];
  /** Lower = more ordered. Null when not a bestseller. */
  bestsellerRank: number | null;
  sortOrder: number;
  needsReview: boolean;
  reviewNote: string | null;
  isCombo: boolean;
  comboComponents: ComboComponent[];
}

export interface WeekdayHours {
  /** 0 = Sunday … 6 = Saturday (JS Date#getDay). */
  day: number;
  /** "HH:MM" local Baku time. Close <= open means the shift ends after midnight. */
  open: string;
  close: string;
  isClosed: boolean;
}

export interface DeliveryZone {
  id: string;
  name: LocalizedText;
  radiusKm: number;
  fee: Qepik;
  minOrder: Qepik;
  /** Order subtotal from which delivery is free; null = never free. */
  freeFrom: Qepik | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  title: LocalizedText;
  body: LocalizedText | null;
  imageUrl: string | null;
  href: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface RestaurantSettings {
  name: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: LocalizedText;
  location: { lat: number; lng: number };
  timezone: string;
  hours: WeekdayHours[];
  preorderEnabled: boolean;
  cashbackPercent: number;
  woltCommissionPercent: number;
  priceDiffWarnPercent: number;
  woltBanner: { enabled: boolean; title: LocalizedText | null; body: LocalizedText | null };
  googleReviewUrl: string | null;
  telegramChatId: string | null;
  aiAssistantEnabled: boolean;
  onlinePaymentEnabled: boolean;
}

export interface MenuData {
  categories: Category[];
  items: MenuItem[];
  optionGroups: OptionGroup[];
}
