import { describe, expect, it } from "vitest";
import { buildSeedMenu } from "@/data/seed-build";
import { buildPublicMenu, compareWithWolt } from "@/lib/menu/public-menu";
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
    expect(bySlug("pizza-meksikano").variants.map((v) => v.label)).toEqual(["Kiçik", "Orta", "Böyük"]);
  });
  it("shows the Wolt price only when it is higher than the site price", () => {
    expect(bySlug("coban-salati").variants[0]).toMatchObject({ price: 300, woltPrice: 460 });
    expect(bySlug("quzu-lulesi").variants[0].woltPrice).toBeNull();
    expect(compareWithWolt(data)).toMatchObject({ cheaperOnSite: 2, pricierOnSite: 0 });
  });
});

describe("priceSelection", () => {
  const pizza = bySlug("pizza-meksikano");
  const mozzarella = menu.addonGroups[pizza.addonGroupIds[0]].options[0];

  it("adds variant and add-on prices and multiplies by quantity", () => {
    const r = priceSelection(
      { itemId: pizza.id, variantId: pizza.variants[2].id, addonIds: [mozzarella.id], quantity: 2 },
      menu.items,
      menu.addonGroups,
    );
    expect(r).toEqual({ unitPrice: 1650, lineTotal: 3300 });
  });
  it("prices linked drink add-ons from the drink itself", () => {
    const doner = bySlug("et-doner");
    const drinks = menu.addonGroups[doner.addonGroupIds[2]];
    expect(drinks.options[0].price).toBe(bySlug("ayran").variants[0].price);
  });
  it("rejects add-ons that do not belong to the item and unknown variants", () => {
    const ayran = bySlug("ayran");
    expect(priceSelection({ itemId: ayran.id, variantId: ayran.variants[0].id, addonIds: [mozzarella.id], quantity: 1 }, menu.items, menu.addonGroups)).toEqual({ error: "unknown_addon" });
    expect(priceSelection({ itemId: ayran.id, variantId: "nope", addonIds: [], quantity: 1 }, menu.items, menu.addonGroups)).toEqual({ error: "unknown_variant" });
  });
});
