import "server-only";
import { cache } from "react";
import { buildSeedMenu, buildSeedZones } from "@/data/seed-build";
import { SEED_SETTINGS } from "@/data/seed-settings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPublicClient } from "@/lib/supabase/public";
import type {
  AddonGroup,
  Category,
  Combo,
  ComboStatus,
  DeliveryZone,
  ItemTag,
  LocalizedText,
  MenuData,
  MenuItem,
  OpeningHoursDay,
  RestaurantSettings,
} from "@/lib/types";

/* Row shapes returned by Supabase (snake_case). */
interface VariantRow {
  id: string;
  label: LocalizedText | null;
  price_site: number;
  price_wolt: number | null;
  sort_order: number;
  is_available: boolean;
}
interface ItemRow {
  id: string;
  slug: string;
  category_id: string;
  name: LocalizedText;
  description: LocalizedText;
  image_url: string | null;
  tags: ItemTag[];
  is_popular: boolean;
  is_new: boolean;
  is_hidden: boolean;
  in_stock: boolean;
  available_site: boolean;
  available_wolt: boolean;
  featured_rank: number | null;
  sort_order: number;
  needs_review: boolean;
  review_note: string | null;
  is_combo: boolean;
  item_variants: VariantRow[];
  item_addon_groups: { group_id: string; sort_order: number }[];
}
interface CategoryRow {
  id: string;
  slug: string;
  name: LocalizedText;
  icon: string;
  sort_order: number;
  is_visible: boolean;
}
interface AddonGroupRow {
  id: string;
  slug: string;
  name: LocalizedText;
  min_select: number;
  max_select: number;
  sort_order: number;
  addon_options: {
    id: string;
    name: LocalizedText;
    price_site: number;
    price_wolt: number | null;
    linked_variant_id: string | null;
    sort_order: number;
    is_available: boolean;
  }[];
}
interface ComboRow {
  id: string;
  item_id: string;
  status: ComboStatus;
  combo_components: { item_id: string; variant_id: string | null; quantity: number }[];
}

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

function mapItem(row: ItemRow): MenuItem {
  return {
    id: row.id,
    slug: row.slug,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? { az: "" },
    imageUrl: row.image_url,
    tags: row.tags ?? [],
    isPopular: row.is_popular,
    isNew: row.is_new,
    isHidden: row.is_hidden,
    inStock: row.in_stock,
    availableSite: row.available_site,
    availableWolt: row.available_wolt,
    featuredRank: row.featured_rank,
    sortOrder: row.sort_order,
    needsReview: row.needs_review,
    reviewNote: row.review_note,
    isCombo: row.is_combo,
    variants: [...row.item_variants].sort(bySort).map((v) => ({
      id: v.id,
      label: v.label,
      priceSite: v.price_site,
      priceWolt: v.price_wolt,
      sortOrder: v.sort_order,
      isAvailable: v.is_available,
    })),
    addonGroupIds: [...row.item_addon_groups].sort(bySort).map((g) => g.group_id),
  };
}

async function fetchMenuFromSupabase(): Promise<MenuData> {
  const db = getPublicClient();
  const [categories, items, groups, combos] = await Promise.all([
    db.from("categories").select("*").order("sort_order"),
    db
      .from("menu_items")
      .select("*, item_variants(*), item_addon_groups(group_id, sort_order)")
      .order("sort_order"),
    db.from("addon_groups").select("*, addon_options(*)").order("sort_order"),
    db.from("combos").select("id, item_id, status, combo_components(item_id, variant_id, quantity)"),
  ]);
  for (const res of [categories, items, groups, combos]) {
    if (res.error) throw new Error(`Supabase menu query failed: ${res.error.message}`);
  }

  return {
    categories: (categories.data as CategoryRow[]).map(
      (c): Category => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        sortOrder: c.sort_order,
        isVisible: c.is_visible,
      }),
    ),
    items: (items.data as ItemRow[]).map(mapItem),
    addonGroups: (groups.data as AddonGroupRow[]).map(
      (g): AddonGroup => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        minSelect: g.min_select,
        maxSelect: g.max_select,
        sortOrder: g.sort_order,
        options: [...g.addon_options].sort(bySort).map((o) => ({
          id: o.id,
          name: o.name,
          priceSite: o.price_site,
          priceWolt: o.price_wolt,
          linkedVariantId: o.linked_variant_id,
          sortOrder: o.sort_order,
          isAvailable: o.is_available,
        })),
      }),
    ),
    combos: (combos.data as ComboRow[]).map(
      (c): Combo => ({
        id: c.id,
        itemId: c.item_id,
        status: c.status,
        components: c.combo_components.map((cc) => ({
          itemId: cc.item_id,
          variantId: cc.variant_id,
          quantity: cc.quantity,
        })),
      }),
    ),
  };
}

interface SettingsRow {
  name: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  address: LocalizedText;
  lat: number;
  lng: number;
  google_maps_url: string;
  google_review_url: string;
  timezone: string;
  opening_hours: OpeningHoursDay[];
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  preorder_enabled: boolean;
  ordering_enabled: boolean;
  cashback_percent: number | string;
  wolt_banner_enabled: boolean;
  wolt_banner_text: LocalizedText;
  hero_image_url: string | null;
  ai_assistant_enabled: boolean;
  online_payment_enabled: boolean;
}

async function fetchSettingsFromSupabase(): Promise<RestaurantSettings> {
  const { data, error } = await getPublicClient().from("restaurant_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Supabase settings query failed: ${error.message}`);
  const r = data as SettingsRow;
  return {
    name: r.name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    instagram: r.instagram,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    googleMapsUrl: r.google_maps_url,
    googleReviewUrl: r.google_review_url,
    timezone: r.timezone,
    openingHours: r.opening_hours,
    pickupEnabled: r.pickup_enabled,
    deliveryEnabled: r.delivery_enabled,
    preorderEnabled: r.preorder_enabled,
    orderingEnabled: r.ordering_enabled,
    cashbackPercent: Number(r.cashback_percent),
    woltBannerEnabled: r.wolt_banner_enabled,
    woltBannerText: r.wolt_banner_text,
    heroImageUrl: r.hero_image_url,
    aiAssistantEnabled: r.ai_assistant_enabled,
    onlinePaymentEnabled: r.online_payment_enabled,
  };
}

interface ZoneRow {
  id: string;
  name: LocalizedText;
  radius_km: number | string;
  fee: number;
  min_order: number;
  eta_minutes: number;
  sort_order: number;
  is_active: boolean;
}

async function fetchZonesFromSupabase(): Promise<DeliveryZone[]> {
  const { data, error } = await getPublicClient().from("delivery_zones").select("*").order("sort_order");
  if (error) throw new Error(`Supabase zones query failed: ${error.message}`);
  return (data as ZoneRow[]).map((z) => ({
    id: z.id,
    name: z.name,
    radiusKm: Number(z.radius_km),
    fee: z.fee,
    minOrder: z.min_order,
    etaMinutes: z.eta_minutes,
    sortOrder: z.sort_order,
    isActive: z.is_active,
  }));
}

/** Full menu (including hidden items and both channels). Deduplicated per request. */
export const getMenuData = cache(async (): Promise<MenuData> => {
  return isSupabaseConfigured() ? fetchMenuFromSupabase() : buildSeedMenu();
});

export const getSettings = cache(async (): Promise<RestaurantSettings> => {
  return isSupabaseConfigured() ? fetchSettingsFromSupabase() : SEED_SETTINGS;
});

export const getDeliveryZones = cache(async (): Promise<DeliveryZone[]> => {
  return isSupabaseConfigured() ? fetchZonesFromSupabase() : buildSeedZones();
});
