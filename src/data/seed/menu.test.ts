import { describe, expect, it } from "vitest";
import { seedMenu } from "./menu";
import { toPublicMenu } from "@/lib/data/public-menu";
import { computeUnitPrice } from "@/lib/pricing";

const { items, categories, optionGroups } = seedMenu;
const find = (id: string) => items.find((i) => i.id === id)!;

describe("seed menu integrity", () => {
  it("has unique ids for items and variants", () => {
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const vids = items.flatMap((i) => i.variants.map((v) => v.id));
    expect(new Set(vids).size).toBe(vids.length);
  });
  it("gives every item at least one variant and a valid category", () => {
    const cats = new Set(categories.map((c) => c.id));
    for (const i of items) {
      expect(i.variants.length).toBeGreaterThan(0);
      expect(cats.has(i.categoryId)).toBe(true);
    }
  });
  it("resolves combo components and option groups", () => {
    const groupIds = new Set(optionGroups.map((g) => g.id));
    for (const i of items) {
      i.optionGroupIds.forEach((g) => expect(groupIds.has(g)).toBe(true));
      for (const c of i.comboComponents) {
        if (c.itemId) expect(find(c.itemId)).toBeTruthy();
        if (c.variantId) expect(find(c.itemId!).variants.some((v) => v.id === c.variantId)).toBe(true);
      }
    }
  });
  it("models pizzas as one item with size variants, not duplicates", () => {
    const m = find("pizza-meksikano");
    expect(m.variants.map((v) => v.label.az)).toEqual(["Kiçik", "Orta", "Böyük"]);
    expect(m.variants.map((v) => v.priceSite)).toEqual([870, 1270, 1500]);
  });
  it("flags suspicious source data for review", () => {
    expect(find("kartof-fri").needsReview).toBe(true);
    expect(find("coban-salati").variants[0]).toMatchObject({ priceSite: 300, priceWolt: 460 });
    expect(find("sezar-salati")).toMatchObject({ availableWolt: false });
    expect(find("toyuq-doner-koz").variants[6].needsReview).toBe(true);
  });
  it("hides drafts, site-unavailable variants and wolt-only rows from the public menu", () => {
    const pub = toPublicMenu(seedMenu);
    expect(pub.items.some((i) => i.isDraft)).toBe(false);
    expect(pub.items.find((i) => i.id === "pendir-cubuqlari")!.variants).toHaveLength(1);
  });
});

describe("computeUnitPrice", () => {
  const pizza = find("pizza-meksikano");
  it("adds option deltas to the variant price", () => {
    expect(computeUnitPrice(pizza, "pizza-meksikano-v3", ["pizza-mozzarella"], optionGroups)).toEqual({
      ok: true,
      unitPrice: 1650,
    });
  });
  it("rejects options that don't belong to the item", () => {
    expect(computeUnitPrice(pizza, "pizza-meksikano-v1", ["sauce-garlic"], optionGroups)).toEqual({
      ok: false,
      error: "option_invalid",
    });
  });
  it("rejects exceeding a group's max selection", () => {
    const doner = find("toyuq-saurma");
    expect(
      computeUnitPrice(doner, "toyuq-saurma-v1", ["sauce-garlic", "sauce-hot", "sauce-bbq"], optionGroups),
    ).toEqual({ ok: false, error: "option_group_max" });
  });
  it("rejects out-of-stock items and unknown variants", () => {
    expect(computeUnitPrice({ ...pizza, inStock: false }, "pizza-meksikano-v1", [], optionGroups).ok).toBe(false);
    expect(computeUnitPrice(pizza, "nope", [], optionGroups)).toEqual({ ok: false, error: "variant_missing" });
  });
});
