import type { DeliveryZone, OpeningHoursDay, RestaurantSettings } from "@/lib/types";

/**
 * Default settings. Hours, address and delivery zones are placeholders —
 * the restaurant confirms them in the admin panel (Settings).
 */
export const DEFAULT_OPENING_HOURS: OpeningHoursDay[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "11:00",
  close: "01:00",
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
  googleMapsUrl: "https://maps.google.com/?q=Alov+Baku",
  googleReviewUrl: "",
  timezone: "Asia/Baku",
  openingHours: DEFAULT_OPENING_HOURS,
  pickupEnabled: true,
  deliveryEnabled: true,
  preorderEnabled: true,
  orderingEnabled: true,
  cashbackPercent: 5,
  woltBannerEnabled: true,
  woltBannerText: {
    az: "Wolt-dan ucuz! Birbaşa sifariş et — komissiyasız qiymət.",
    ru: "Дешевле, чем в Wolt! Заказывайте напрямую — без наценки.",
    en: "Cheaper than Wolt! Order direct — no commission markup.",
  },
  heroImageUrl: null,
  aiAssistantEnabled: false,
  onlinePaymentEnabled: false,
};

export interface SeedZone extends Omit<DeliveryZone, "id"> {
  slug: string;
}

export const SEED_ZONES: SeedZone[] = [
  {
    slug: "zone-1",
    name: { az: "Yaxın zona (0–3 km)", ru: "Ближняя зона (0–3 км)", en: "Near zone (0–3 km)" },
    radiusKm: 3,
    fee: 200,
    minOrder: 1000,
    etaMinutes: 40,
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "zone-2",
    name: { az: "Orta zona (3–6 km)", ru: "Средняя зона (3–6 км)", en: "Middle zone (3–6 km)" },
    radiusKm: 6,
    fee: 300,
    minOrder: 1500,
    etaMinutes: 55,
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "zone-3",
    name: { az: "Uzaq zona (6–10 km)", ru: "Дальняя зона (6–10 км)", en: "Far zone (6–10 km)" },
    radiusKm: 10,
    fee: 450,
    minOrder: 2000,
    etaMinutes: 70,
    sortOrder: 3,
    isActive: true,
  },
];
