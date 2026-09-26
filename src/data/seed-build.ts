/**
 * Turns the human-friendly seed definitions into domain objects with
 * deterministic UUIDs, so the in-memory fallback and `supabase/seed.sql`
 * share exactly the same IDs.
 */
import { createHash } from "node:crypto";
import { toQepik } from "@/lib/money";
import type { AddonGroup, Category, Combo, DeliveryZone, MenuData, MenuItem } from "@/lib/types";
import { SEED_ADDON_GROUPS, SEED_CATEGORIES, SEED_COMBOS } from "./seed-menu";
import { SEED_ZONES } from "./seed-settings";

/** Name-based UUID (v5 layout) derived from a stable key. */
export function seedUuid(key: string): string {
  const hex = createHash("sha1").update(`alov-baku:${key}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const variantKey = (itemSlug: string, index: number) => `variant:${itemSlug}#${index}`;

export function buildSeedMenu(): MenuData {
  const categories: Category[] = SEED_CATEGORIES.map((c, i) => ({
    id: seedUuid(`category:${c.slug}`),
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    sortOrder: i + 1,
    isVisible: true,
  }));

  const groupIdBySlug = new Map(SEED_ADDON_GROUPS.map((g) => [g.slug, seedUuid(`addon-group:${g.slug}`)]));

  const items: MenuItem[] = SEED_CATEGORIES.flatMap((c) =>
    c.items.map((it, i): MenuItem => ({
      id: seedUuid(`item:${it.slug}`),
      slug: it.slug,
      categoryId: seedUuid(`category:${c.slug}`),
      name: it.name,
      description: it.description ?? { az: "" },
      imageUrl: null,
      tags: it.tags ?? [],
      isPopular: it.popular ?? false,
      isNew: it.isNew ?? false,
      isHidden: it.hidden ?? false,
      inStock: true,
      availableSite: true,
      availableWolt: !it.siteOnly,
      featuredRank: it.featured ?? null,
      sortOrder: i + 1,
      needsReview: Boolean(it.review),
      reviewNote: it.review ?? null,
      isCombo: c.slug === "kombolar",
      variants: it.variants.map((v, vi) => ({
        id: seedUuid(variantKey(it.slug, vi)),
        label: v.label ?? null,
        priceSite: toQepik(v.site),
        priceWolt: it.siteOnly || v.wolt === null ? null : toQepik(v.wolt ?? v.site),
        sortOrder: vi + 1,
        isAvailable: true,
      })),
      addonGroupIds: (it.addons ?? []).map((slug) => {
        const id = groupIdBySlug.get(slug);
        if (!id) throw new Error(`Unknown addon group "${slug}" on ${it.slug}`);
        return id;
      }),
    })),
  );

  const itemIds = new Set(items.map((i) => i.slug));
  const resolveVariant = (ref: string) => {
    const [slug, idx] = ref.split("#");
    if (!itemIds.has(slug)) throw new Error(`Unknown linked item "${slug}"`);
    return seedUuid(variantKey(slug, Number(idx)));
  };

  const addonGroups: AddonGroup[] = SEED_ADDON_GROUPS.map((g, gi) => ({
    id: groupIdBySlug.get(g.slug)!,
    slug: g.slug,
    name: g.name,
    minSelect: g.min,
    maxSelect: g.max,
    sortOrder: gi + 1,
    options: g.options.map((o, oi) => ({
      id: seedUuid(`addon:${g.slug}:${o.slug}`),
      name: o.name,
      priceSite: toQepik(o.price),
      priceWolt: toQepik(o.price),
      linkedVariantId: o.linked ? resolveVariant(o.linked) : null,
      sortOrder: oi + 1,
      isAvailable: !o.unconfirmed,
    })),
  }));

  const combos: Combo[] = SEED_COMBOS.map((c) => {
    if (!itemIds.has(c.item)) throw new Error(`Unknown combo item "${c.item}"`);
    return {
      id: seedUuid(`combo:${c.item}`),
      itemId: seedUuid(`item:${c.item}`),
      status: c.status,
      components: c.components.map((cc) => {
        if (!itemIds.has(cc.item)) throw new Error(`Unknown combo component "${cc.item}"`);
        return {
          itemId: seedUuid(`item:${cc.item}`),
          variantId: cc.variant === undefined ? null : seedUuid(variantKey(cc.item, cc.variant)),
          quantity: cc.qty ?? 1,
        };
      }),
    };
  });

  return { categories, items, addonGroups, combos };
}

export function buildSeedZones(): DeliveryZone[] {
  return SEED_ZONES.map(({ slug, ...z }) => ({ id: seedUuid(`zone:${slug}`), ...z }));
}
