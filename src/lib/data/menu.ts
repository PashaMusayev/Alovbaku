import "server-only";
import { seedMenu } from "@/data/seed/menu";
import { seedPromotions, seedSettings, seedZones } from "@/data/seed/settings";
import { isSupabaseConfigured } from "@/lib/env";
import { publicSupabase } from "@/lib/supabase/public";
import type { DeliveryZone, MenuData, Promotion, RestaurantSettings } from "@/lib/types";
import {
  toCategory,
  toItem,
  toOptionGroup,
  toPromotion,
  toZone,
  type CategoryRow,
  type ItemRow,
  type OptionGroupRow,
  type PromotionRow,
  type ZoneRow,
} from "./mappers";
import { toPublicMenu } from "./public-menu";
import { mergeSettings, PUBLIC_SETTINGS_KEY } from "./settings-keys";

/** Public menu (what customers see). Falls back to seed data in demo mode. */
export async function getPublicMenu(): Promise<MenuData> {
  if (!isSupabaseConfigured()) return toPublicMenu(seedMenu);

  const db = publicSupabase();
  const [cats, items, groups] = await Promise.all([
    db.from("categories").select("*").order("sort_order"),
    db
      .from("items")
      .select("*, item_variants(*), item_option_groups(group_id, sort_order), combo_components!combo_components_combo_item_id_fkey(*)")
      .order("sort_order"),
    db.from("option_groups").select("*, options(*)").order("sort_order"),
  ]);
  const error = cats.error ?? items.error ?? groups.error;
  if (error) throw new Error(`Failed to load menu: ${error.message}`);

  return toPublicMenu({
    categories: (cats.data as CategoryRow[]).map(toCategory),
    items: (items.data as ItemRow[]).map(toItem),
    optionGroups: (groups.data as OptionGroupRow[]).map(toOptionGroup),
  });
}

export async function getSettings(): Promise<RestaurantSettings> {
  if (!isSupabaseConfigured()) return seedSettings;
  const { data, error } = await publicSupabase()
    .from("settings")
    .select("value")
    .eq("key", PUBLIC_SETTINGS_KEY)
    .maybeSingle();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  return mergeSettings(seedSettings, data?.value ?? null, null);
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  if (!isSupabaseConfigured()) return seedZones.filter((z) => z.isActive);
  const { data, error } = await publicSupabase()
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Failed to load delivery zones: ${error.message}`);
  return (data as ZoneRow[]).map(toZone);
}

export async function getPromotions(): Promise<Promotion[]> {
  if (!isSupabaseConfigured()) return seedPromotions.filter((p) => p.isActive);
  // Rounded to the hour so the cached request URL stays stable.
  const now = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const { data, error } = await publicSupabase()
    .from("promotions")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("sort_order");
  if (error) throw new Error(`Failed to load promotions: ${error.message}`);
  return (data as PromotionRow[]).map(toPromotion);
}
