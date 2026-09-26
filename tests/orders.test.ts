import { describe, expect, it } from "vitest";
import { buildSeedMenu, buildSeedZones } from "@/data/seed-build";
import { SEED_SETTINGS } from "@/data/seed-settings";
import { findBestCombo } from "@/lib/cart/combos";
import { lineKey, type CartLine } from "@/lib/cart/store";
import { pickUpsell } from "@/lib/cart/upsell";
import { buildPublicMenu, buildPublicSettings } from "@/lib/menu/public-menu";
import { formatOrderForStaff } from "@/lib/orders/format";
import { computeQuote, pickZone, preorderSlots } from "@/lib/orders/quote";
import { canTransition, nextStatuses } from "@/lib/orders/status";
import type { OrderRecord } from "@/lib/orders/types";
import { normalizeAzPhone } from "@/lib/phone";
import type { PublicDeliveryZone } from "@/lib/types";

const menu = buildPublicMenu(buildSeedMenu(), "az");
const settings = buildPublicSettings(SEED_SETTINGS, buildSeedZones(), "az");
const item = (slug: string) => Object.values(menu.items).find((i) => i.slug === slug)!;
const line = (slug: string, quantity = 1, variant = 0): CartLine => {
  const it = item(slug);
  return { key: lineKey(it.id, it.variants[variant].id, []), itemId: it.id, variantId: it.variants[variant].id, addonIds: [], quantity };
};
// 2026-09-26 12:00 Baku (open, 10:00–03:00) and 05:00 Baku (closed).
const OPEN = new Date("2026-09-26T08:00:00Z");
const CLOSED = new Date("2026-09-26T01:00:00Z");

describe("normalizeAzPhone", () => {
  it("accepts common ways of writing an Azerbaijani mobile number", () => {
    for (const input of ["055 243 79 99", "55 243 79 99", "+994 55 243 79 99", "994552437999", "(055) 243-79-99"]) {
      expect(normalizeAzPhone(input)).toBe("+994552437999");
    }
  });
  it("rejects wrong lengths and unknown operator codes", () => {
    expect(normalizeAzPhone("55 243 79 9")).toBeNull();
    expect(normalizeAzPhone("33 243 79 99")).toBeNull();
    expect(normalizeAzPhone("+7 912 345 67 89")).toBeNull();
  });
});

describe("computeQuote", () => {
  const lines = [line("et-doner", 2, 2), line("ayran")];

  it("prices lines on the server side with free delivery", () => {
    const q = computeQuote(menu, settings, { fulfillment: "delivery", lines }, OPEN);
    expect(q.errors).toEqual([]);
    expect(q.subtotal).toBe(2 * 530 + 110);
    expect(q.deliveryFee).toBe(0);
    expect(q.total).toBe(1170);
  });

  it("ignores any client idea of prices: unknown items are rejected, not priced", () => {
    const q = computeQuote(menu, settings, { fulfillment: "pickup", lines: [...lines, { ...lines[0], variantId: "x" }] }, OPEN);
    expect(q.errors).toContain("invalid_lines");
    expect(q.invalidLines).toEqual([2]);
  });

  it("refuses 'as soon as possible' orders while closed but accepts a pre-order", () => {
    expect(computeQuote(menu, settings, { fulfillment: "pickup", lines }, CLOSED).errors).toEqual(["closed"]);
    const slot = preorderSlots(settings, CLOSED)[0];
    expect(computeQuote(menu, settings, { fulfillment: "pickup", lines, scheduledFor: slot }, CLOSED).errors).toEqual([]);
  });

  it("rejects pre-orders outside opening hours or too soon", () => {
    const at5am = "2026-09-27T01:00:00Z"; // 05:00 Baku
    expect(computeQuote(menu, settings, { fulfillment: "pickup", lines, scheduledFor: at5am }, OPEN).errors).toEqual(["invalid_schedule"]);
    const in10min = new Date(OPEN.getTime() + 10 * 60_000).toISOString();
    expect(computeQuote(menu, settings, { fulfillment: "pickup", lines, scheduledFor: in10min }, OPEN).errors).toEqual(["invalid_schedule"]);
  });

  it("enforces delivery zone and minimum order when configured", () => {
    const zones: PublicDeliveryZone[] = [{ id: "z", name: "Z", radiusKm: 3, fee: 200, minOrder: 1500, etaMinutes: 40 }];
    const s = { ...settings, zones };
    const near = computeQuote(menu, s, { fulfillment: "delivery", lines, lat: settings.lat + 0.001, lng: settings.lng }, OPEN);
    expect(near.errors).toEqual(["below_minimum"]);
    expect(near.total).toBe(1170 + 200);
    const far = computeQuote(menu, s, { fulfillment: "delivery", lines, lat: 40.6, lng: 49.6 }, OPEN);
    expect(far.errors).toContain("out_of_zone");
  });

  it("charges the most expensive zone when no pin is given", () => {
    const zones: PublicDeliveryZone[] = [
      { id: "a", name: "A", radiusKm: 3, fee: 100, minOrder: 0, etaMinutes: 30 },
      { id: "b", name: "B", radiusKm: 8, fee: 300, minOrder: 0, etaMinutes: 50 },
    ];
    expect(pickZone(zones, settings)?.id).toBe("b");
  });
});

describe("preorderSlots", () => {
  it("only offers times inside opening hours, at least 30 minutes ahead", () => {
    const slots = preorderSlots(settings, CLOSED);
    expect(slots[0]).toBe("2026-09-26T06:00:00.000Z"); // 10:00 Baku
    expect(slots.every((s) => new Date(s).getTime() - CLOSED.getTime() >= 30 * 60_000)).toBe(true);
  });
});

describe("findBestCombo", () => {
  it("suggests the cheeseburger + fries combo with the real saving", () => {
    const suggestion = findBestCombo([line("double-toyuq-cizburger"), line("kartof-fri")], menu);
    expect(suggestion?.comboItemId).toBe(item("kombo-toyuq-cizburger-fri").id);
    expect(suggestion?.savings).toBe(1060 + 250 - 990);
  });
  it("does not suggest a combo that would cost more", () => {
    expect(findBestCombo([line("toyuq-naggets"), line("kartof-fri")], menu)).toBeNull(); // 3,80 + 2,50 < 8,40
  });
  it("needs every component", () => {
    expect(findBestCombo([line("double-toyuq-cizburger")], menu)).toBeNull();
  });
});

describe("pickUpsell", () => {
  it("offers ayran after a main dish, fries once a drink is in the cart", () => {
    expect(pickUpsell(item("et-doner").id, [line("et-doner")], menu)?.slug).toBe("ayran");
    expect(pickUpsell(item("et-doner").id, [line("et-doner"), line("coca-cola")], menu)?.slug).toBe("kartof-fri");
  });
  it("stays quiet for drinks and snacks", () => {
    expect(pickUpsell(item("ayran").id, [line("ayran")], menu)).toBeNull();
  });
});

describe("order status flow", () => {
  it("follows the delivery and pickup timelines", () => {
    expect(nextStatuses("new", "delivery")).toEqual(["accepted", "rejected"]);
    expect(nextStatuses("preparing", "delivery")[0]).toBe("on_the_way");
    expect(nextStatuses("preparing", "pickup")[0]).toBe("ready");
    expect(canTransition("delivered", "accepted", "delivery")).toBe(false);
    expect(canTransition("new", "delivered", "delivery")).toBe(false);
  });
});

describe("formatOrderForStaff", () => {
  const order: OrderRecord = {
    id: "00000000-0000-0000-0000-000000000000",
    number: 1001,
    token: "t",
    status: "new",
    fulfillment: "delivery",
    customerName: "Əli <b>",
    phone: "+994552437999",
    address: "Nizami 10",
    addressNotes: "3-cü mərtəbə",
    lat: 40.4,
    lng: 49.9,
    zoneId: null,
    paymentMethod: "cash",
    subtotal: 990,
    deliveryFee: 0,
    discount: 0,
    total: 990,
    notes: "soğansız",
    scheduledFor: null,
    locale: "az",
    createdAt: "",
    items: [{ itemId: null, variantId: null, itemName: "Ət dönər", variantLabel: "Lavaşda", addons: ["Ayran 200 ml"], unitPrice: 640, quantity: 1, lineTotal: 640 }],
    events: [],
  };
  it("contains everything the kitchen and courier need, HTML-escaped", () => {
    const text = formatOrderForStaff(order, { html: true });
    for (const part of ["#1001", "Ət dönər (Lavaşda) + Ayran 200 ml", "Pulsuz", "9,90", "Nağd", "+994 55 243 79 99", "Nizami 10", "3-cü mərtəbə", "maps.google.com/?q=40.4,49.9", "soğansız"]) {
      expect(text).toContain(part);
    }
    expect(text).toContain("Əli &lt;b&gt;");
  });
});
