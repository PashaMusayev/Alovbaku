import type { DeliveryZone, OpeningHoursDay, RestaurantSettings } from "@/lib/types";

/**
 * Settings confirmed by the restaurant (2026-09-26): open daily 10:00–03:00,
 * free delivery, no minimum order, no delivery zones.
 * The street address text is still a placeholder.
 */
export const DEFAULT_OPENING_HOURS: OpeningHoursDay[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "10:00",
  close: "03:00",
  closed: false,
}));

export const SEED_SETTINGS: RestaurantSettings = {
  name: "Alov Baku",
  phone: "+994552437999",
  whatsapp: "+994552437999",
  instagram: "alov_baku_",
  address: { az: "Bakı, Azərbaycan", ru: "Баку, Азербайджан", en: "Baku, Azerbaijan" },
  lat: 40.4093,
  lng: 49.8671,
  googleMapsUrl: "https://maps.app.goo.gl/c1NGwEfpxcu64au59",
  mapEmbedQuery: "Alov Baku, Bakı",
  googleReviewUrl: "",
  timezone: "Asia/Baku",
  openingHours: DEFAULT_OPENING_HOURS,
  pickupEnabled: true,
  deliveryEnabled: true,
  preorderEnabled: true,
  orderingEnabled: true,
  cashbackPercent: 5,
  heroImageUrl: null,
  aiAssistantEnabled: false,
  onlinePaymentEnabled: false,
};

export interface SeedZone extends Omit<DeliveryZone, "id"> {
  slug: string;
}

/** One city-wide zone: free delivery, no minimum order. */
export const SEED_ZONES: SeedZone[] = [
  {
    slug: "zone-1",
    name: { az: "Bakı", ru: "Баку", en: "Baku" },
    radiusKm: 40,
    fee: 0,
    minOrder: 0,
    etaMinutes: 45,
    sortOrder: 1,
    isActive: true,
  },
];
