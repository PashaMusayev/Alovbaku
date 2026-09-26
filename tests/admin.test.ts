import { describe, expect, it } from "vitest";
import { buildSeedMenu } from "@/data/seed-build";
import { computeAnalytics, localDate } from "@/lib/admin/analytics";
import { toCsv } from "@/lib/admin/csv";
import { slugify } from "@/lib/admin/slug";
import { parseQuantity, validateMenu } from "@/lib/admin/validation";
import type { OrderRecord } from "@/lib/orders/types";

const menu = buildSeedMenu();
const bySlug = (slug: string) => menu.items.find((i) => i.slug === slug)!;
const kinds = (slug: string, m = menu) =>
  validateMenu(m)
    .filter((w) => w.itemId === bySlug(slug).id)
    .map((w) => w.kind);

describe("validateMenu", () => {
  it("flags a bigger drink that costs less than a smaller one (330 ml vs 500 ml)", () => {
    expect(kinds("coca-cola")).toContain("size_price");
    expect(kinds("sprite")).not.toContain("size_price");
  });

  it("flags unnamed variants, empty descriptions and review notes", () => {
    expect(kinds("pendir-cubuqlari")).toEqual(expect.arrayContaining(["variant_label", "needs_review"]));
    expect(kinds("pide-qiymeli")).toContain("empty_description");
  });

  it("flags fries at 12,10 ₼ as abnormal for the snacks category", () => {
    const broken = structuredClone(menu);
    broken.items.find((i) => i.slug === "kartof-fri")!.variants[0].price = 1210;
    expect(kinds("kartof-fri", broken)).toContain("price_outlier");
    expect(kinds("kartof-fri")).not.toContain("price_outlier");
  });

  it("does not flag legitimately pricier items (lamb shish, Fuse Tea)", () => {
    expect(kinds("quzu-tikesi")).not.toContain("price_outlier");
    expect(kinds("fuse-tea-manqo")).not.toContain("price_outlier");
  });

  it("parses quantities from variant labels", () => {
    expect(parseQuantity("1 L")).toEqual({ unit: "ml", amount: 1000 });
    expect(parseQuantity("6 əd.")).toEqual({ unit: "əd", amount: 6 });
    expect(parseQuantity("Böyük · 35 sm")).toEqual({ unit: "sm", amount: 35 });
    expect(parseQuantity("Lavaşda")).toBeNull();
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs from Azerbaijani names", () => {
    expect(slugify("Ət dönər Lavaşda")).toBe("et-doner-lavasda");
    expect(slugify("Çiy küftə dürüm!")).toBe("ciy-kufte-durum");
  });
});

describe("toCsv", () => {
  it("escapes commas and quotes and adds a BOM for Excel", () => {
    const csv = toCsv(["Ad", "Qeyd"], [["Əli", 'dedi "salam", sonra'], ["Aysel", null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain('Əli,"dedi ""salam"", sonra"');
    expect(csv).toContain("Aysel,\r\n");
  });
});

describe("computeAnalytics", () => {
  const order = (phone: string, iso: string, total: number, status: OrderRecord["status"] = "delivered"): OrderRecord => ({
    id: iso + phone,
    number: 1,
    token: "t",
    status,
    fulfillment: "delivery",
    customerName: "X",
    phone,
    address: null,
    addressNotes: null,
    lat: null,
    lng: null,
    zoneId: null,
    paymentMethod: "cash",
    subtotal: total,
    deliveryFee: 0,
    discount: 0,
    total,
    notes: null,
    scheduledFor: null,
    locale: "az",
    createdAt: iso,
    telegramChatId: null,
    telegramMessageId: null,
    items: [{ itemId: null, variantId: null, itemName: "Ət dönər", variantLabel: "Lavaşda", addons: [], unitPrice: total, quantity: 2, lineTotal: total }],
    events: [],
  });
  const now = new Date("2026-09-26T12:00:00Z");
  const orders = [
    order("+994551111111", "2026-06-01T10:00:00Z", 1000), // old order → returning customer
    order("+994551111111", "2026-09-25T16:30:00Z", 1500), // 20:30 Baku
    order("+994552222222", "2026-09-26T08:10:00Z", 500), // 12:10 Baku, new customer
    order("+994553333333", "2026-09-26T09:00:00Z", 9999, "rejected"), // ignored
  ];
  const a = computeAnalytics(orders, now, 7, "Asia/Baku");

  it("totals revenue and average order value, ignoring rejected orders", () => {
    expect(a.totals).toEqual({ orders: 2, revenue: 2000, averageOrder: 1000 });
    expect(a.days).toHaveLength(7);
    expect(a.days.at(-1)).toEqual({ date: "2026-09-26", orders: 1, revenue: 500 });
  });
  it("buckets peak hours in restaurant time and splits new vs returning", () => {
    expect(a.hours[20]).toBe(1);
    expect(a.hours[12]).toBe(1);
    expect(a.customers).toEqual({ new: 1, returning: 1 });
    expect(a.topItems[0]).toEqual({ name: "Ət dönər (Lavaşda)", quantity: 4, revenue: 2000 });
  });
  it("uses the restaurant's calendar day", () => {
    expect(localDate("2026-09-25T21:30:00Z", "Asia/Baku")).toBe("2026-09-26");
  });
});
