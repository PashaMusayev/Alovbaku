import { describe, expect, it } from "vitest";
import { buildSeedMenu } from "@/data/seed-build";
import { buildPublicMenu } from "@/lib/menu/public-menu";
import { priceSelection } from "@/lib/menu/pricing";

const data = buildSeedMenu();
const menu = buildPublicMenu(data, "az");
const bySlug = (slug: string) => Object.values(menu.items).find((i) => i.slug === slug)!;

describe("seed menu", () => {
  it("never shows salads first and hides draft combos", () => {
    expect(menu.categories[0].slug).toBe("et-doner");
    expect(menu.categories.at(-2)?.slug).toBe("salatlar");
    expect(Object.values(menu.items).some((i) => i.slug === "kombo-doner-ayran")).toBe(false);
  });
  it("models pizza sizes as variants, not duplicate items", () => {
    expect(bySlug("pizza-meksikano").variants.map((v) => v.label)).toEqual([
      "Kiçik · 25 sm",
      "Orta · 32 sm",
      "Böyük · 35 sm",
    ]);
  });
  it("uses the confirmed site prices", () => {
    expect(bySlug("kartof-fri").variants[0].price).toBe(250);
    expect(bySlug("coban-salati").variants[0].price).toBe(300);
  });
  it("sends nothing about Wolt to the public site", () => {
    expect(JSON.stringify(menu).toLowerCase()).not.toContain("wolt");
  });
  it("hides add-ons whose prices are not confirmed yet", () => {
    const doner = bySlug("et-doner");
    const groups = doner.addonGroupIds.map((id) => menu.addonGroups[id]);
    expect(groups.map((g) => g.name)).toEqual(["İçki əlavə et"]);
    expect(groups[0].options.length).toBe(4);
    expect(bySlug("kartof-fri").addonGroupIds).toEqual([]);
  });
});

describe("priceSelection", () => {
  const pizza = bySlug("pizza-meksikano");
  const cola = menu.addonGroups[pizza.addonGroupIds[0]].options[1];

  it("adds variant and add-on prices and multiplies by quantity", () => {
    const r = priceSelection(
      { itemId: pizza.id, variantId: pizza.variants[2].id, addonIds: [cola.id], quantity: 2 },
      menu.items,
      menu.addonGroups,
    );
    expect(r).toEqual({ unitPrice: 1660, lineTotal: 3320 });
  });
  it("prices linked drink add-ons from the drink itself", () => {
    const doner = bySlug("et-doner");
    const drinks = menu.addonGroups[doner.addonGroupIds[0]];
    expect(drinks.options[0].price).toBe(bySlug("ayran").variants[0].price);
  });
  it("rejects add-ons that do not belong to the item and unknown variants", () => {
    const ayran = bySlug("ayran");
    expect(priceSelection({ itemId: ayran.id, variantId: ayran.variants[0].id, addonIds: [cola.id], quantity: 1 }, menu.items, menu.addonGroups)).toEqual({ error: "unknown_addon" });
    expect(priceSelection({ itemId: ayran.id, variantId: "nope", addonIds: [], quantity: 1 }, menu.items, menu.addonGroups)).toEqual({ error: "unknown_variant" });
  });
});
