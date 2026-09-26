import "server-only";
import { randomUUID } from "node:crypto";
import { DEFAULT_PRIVATE_SETTINGS, memoryDb, type PrivateSettings } from "@/lib/data/memory-db";
import { getServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { DeliveryZone, RestaurantSettings } from "@/lib/types";
import { AdminDataError } from "./menu-admin";

const supabase = () => isSupabaseConfigured();

function check<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new AdminDataError(res.error.message);
  return res;
}

export async function getPrivateSettings(): Promise<PrivateSettings> {
  if (!supabase()) return { ...memoryDb().privateSettings };
  const res = check(await getServiceClient().from("private_settings").select("*").eq("id", 1).maybeSingle());
  const row = res.data as { telegram_chat_id: string | null; price_outlier_factor: number | string } | null;
  return row
    ? { telegramChatId: row.telegram_chat_id, priceOutlierFactor: Number(row.price_outlier_factor) }
    : { ...DEFAULT_PRIVATE_SETTINGS };
}

export async function savePrivateSettings(s: PrivateSettings): Promise<void> {
  if (!supabase()) {
    memoryDb().privateSettings = { ...s };
    return;
  }
  check(
    await getServiceClient()
      .from("private_settings")
      .upsert({ id: 1, telegram_chat_id: s.telegramChatId, price_outlier_factor: s.priceOutlierFactor }),
  );
}

export async function saveSettings(s: RestaurantSettings): Promise<void> {
  if (!supabase()) {
    memoryDb().settings = structuredClone(s);
    return;
  }
  check(
    await getServiceClient()
      .from("restaurant_settings")
      .update({
        name: s.name,
        phone: s.phone,
        whatsapp: s.whatsapp,
        instagram: s.instagram,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        google_maps_url: s.googleMapsUrl,
        map_embed_query: s.mapEmbedQuery,
        google_review_url: s.googleReviewUrl,
        opening_hours: s.openingHours,
        pickup_enabled: s.pickupEnabled,
        delivery_enabled: s.deliveryEnabled,
        preorder_enabled: s.preorderEnabled,
        ordering_enabled: s.orderingEnabled,
        cashback_percent: s.cashbackPercent,
        hero_image_url: s.heroImageUrl,
        ai_assistant_enabled: s.aiAssistantEnabled,
        online_payment_enabled: s.onlinePaymentEnabled,
      })
      .eq("id", 1),
  );
}

/** Replaces the zone list: updates existing, inserts new, removes deleted. */
export async function saveZones(zones: (Omit<DeliveryZone, "id"> & { id?: string })[]): Promise<void> {
  const withIds = zones.map((z, i) => ({ ...z, id: z.id ?? randomUUID(), sortOrder: i + 1 }));
  if (!supabase()) {
    memoryDb().zones = withIds;
    return;
  }
  const db = getServiceClient();
  const existing = check(await db.from("delivery_zones").select("id")).data as { id: string }[];
  const keep = new Set(withIds.map((z) => z.id));
  const removed = existing.map((z) => z.id).filter((id) => !keep.has(id));
  if (removed.length) check(await db.from("delivery_zones").delete().in("id", removed));
  if (withIds.length) {
    check(
      await db.from("delivery_zones").upsert(
        withIds.map((z) => ({
          id: z.id,
          name: z.name,
          radius_km: z.radiusKm,
          fee: z.fee,
          min_order: z.minOrder,
          eta_minutes: z.etaMinutes,
          sort_order: z.sortOrder,
          is_active: z.isActive,
        })),
      ),
    );
  }
}
