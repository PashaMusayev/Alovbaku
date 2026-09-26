import { azn } from "@/lib/money";
import type { DeliveryZone, Promotion, RestaurantSettings, WeekdayHours } from "@/lib/types";

/**
 * Default settings. Values marked TODO are placeholders the restaurant must
 * confirm in /admin → Settings (address, coordinates, hours, zones).
 */
const hours: WeekdayHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  day,
  open: "11:00",
  close: "01:00",
  isClosed: false,
}));

export const seedSettings: RestaurantSettings = {
  name: "Alov Baku",
  phone: "+994552437999",
  whatsapp: "+994552437999",
  instagram: "alov_baku_",
  // TODO(restaurant): replace with the real street address.
  address: {
    az: "Bakı, Azərbaycan (ünvanı admin paneldə dəqiqləşdirin)",
    ru: "Баку, Азербайджан",
    en: "Baku, Azerbaijan",
  },
  // TODO(restaurant): exact coordinates of the kitchen (used for delivery zones + map pin).
  location: { lat: 40.4093, lng: 49.8671 },
  timezone: "Asia/Baku",
  hours,
  preorderEnabled: true,
  cashbackPercent: 5,
  woltCommissionPercent: 30,
  priceDiffWarnPercent: 15,
  woltBanner: { enabled: true, title: null, body: null },
  googleReviewUrl: null,
  telegramChatId: null,
  aiAssistantEnabled: false,
  onlinePaymentEnabled: false,
};

export const seedZones: DeliveryZone[] = [
  { id: "zone-1", name: { az: "Yaxın (3 km-ə qədər)", ru: "Рядом (до 3 км)", en: "Nearby (up to 3 km)" }, radiusKm: 3, fee: azn(2), minOrder: azn(10), freeFrom: azn(40), sortOrder: 0, isActive: true },
  { id: "zone-2", name: { az: "Orta (3–6 km)", ru: "Средняя (3–6 км)", en: "Mid (3–6 km)" }, radiusKm: 6, fee: azn(3.5), minOrder: azn(15), freeFrom: azn(60), sortOrder: 1, isActive: true },
  { id: "zone-3", name: { az: "Uzaq (6–10 km)", ru: "Далеко (6–10 км)", en: "Far (6–10 km)" }, radiusKm: 10, fee: azn(5), minOrder: azn(20), freeFrom: null, sortOrder: 2, isActive: true },
];

export const seedPromotions: Promotion[] = [];
