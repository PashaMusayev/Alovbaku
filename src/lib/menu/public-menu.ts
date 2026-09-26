import { localize } from "@/lib/i18n-text";
import type {
  DeliveryZone,
  Locale,
  MenuData,
  MenuItem,
  PublicAddonGroup,
  PublicCategory,
  PublicItem,
  PublicMenu,
  PublicSettings,
  RestaurantSettings,
} from "@/lib/types";

/** Is the item orderable on the website at all (ignoring stock)? */
export function isVisibleOnSite(item: MenuItem, visibleCategoryIds: Set<string>): boolean {
  return (
    item.availableSite &&
    !item.isHidden &&
    visibleCategoryIds.has(item.categoryId) &&
    item.variants.some((v) => v.isAvailable)
  );
}

/** Price lookup for every variant (needed for add-ons linked to a product). */
function variantPriceIndex(data: MenuData): Map<string, number> {
  const index = new Map<string, number>();
  for (const item of data.items) for (const v of item.variants) index.set(v.id, v.priceSite);
  return index;
}

const MAX_BESTSELLERS = 8;

/**
 * Localized, site-channel view of the menu for the client.
 * `salesRank` (item id → units sold) overrides the manual featured order when available.
 */
export function buildPublicMenu(data: MenuData, locale: Locale, salesRank?: Map<string, number>): PublicMenu {
  const categories = data.categories.filter((c) => c.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const visibleCategoryIds = new Set(categories.map((c) => c.id));
  const iconByCategory = new Map(categories.map((c) => [c.id, c.icon]));
  const variantPrices = variantPriceIndex(data);

  const items: Record<string, PublicItem> = {};
  for (const item of data.items) {
    if (!isVisibleOnSite(item, visibleCategoryIds)) continue;
    items[item.id] = {
      id: item.id,
      slug: item.slug,
      categoryId: item.categoryId,
      categoryIcon: iconByCategory.get(item.categoryId) ?? "🍽️",
      name: localize(item.name, locale),
      description: localize(item.description, locale),
      imageUrl: item.imageUrl,
      tags: item.tags,
      isPopular: item.isPopular,
      isNew: item.isNew,
      inStock: item.inStock,
      isCombo: item.isCombo,
      featuredRank: item.featuredRank,
      variants: item.variants
        .filter((v) => v.isAvailable)
        .map((v) => ({
          id: v.id,
          label: v.label ? localize(v.label, locale) || null : null,
          price: v.priceSite,
          woltPrice: item.availableWolt && v.priceWolt !== null && v.priceWolt > v.priceSite ? v.priceWolt : null,
        })),
      addonGroupIds: item.addonGroupIds,
    };
  }

  const publicCategories: PublicCategory[] = categories
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: localize(c.name, locale),
      icon: c.icon,
      itemIds: data.items
        .filter((i) => i.categoryId === c.id && items[i.id])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((i) => i.id),
    }))
    .filter((c) => c.itemIds.length > 0);

  const addonGroups: Record<string, PublicAddonGroup> = {};
  for (const g of data.addonGroups) {
    addonGroups[g.id] = {
      id: g.id,
      name: localize(g.name, locale),
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options
        .filter((o) => o.isAvailable)
        .map((o) => ({
          id: o.id,
          name: localize(o.name, locale),
          price: (o.linkedVariantId ? variantPrices.get(o.linkedVariantId) : undefined) ?? o.priceSite,
        })),
    };
  }

  const combos = data.combos
    .filter((c) => c.status === "active" && items[c.itemId] && c.components.length > 0)
    .map((c) => ({ id: c.id, itemId: c.itemId, components: c.components }));

  return { categories: publicCategories, items, addonGroups, combos, bestsellerIds: pickBestsellers(items, salesRank) };
}

function pickBestsellers(items: Record<string, PublicItem>, salesRank?: Map<string, number>): string[] {
  const all = Object.values(items).filter((i) => i.inStock && !i.isCombo);
  if (salesRank && salesRank.size >= MAX_BESTSELLERS) {
    return all
      .filter((i) => salesRank.has(i.id))
      .sort((a, b) => (salesRank.get(b.id) ?? 0) - (salesRank.get(a.id) ?? 0))
      .slice(0, MAX_BESTSELLERS)
      .map((i) => i.id);
  }
  return all
    .filter((i) => i.featuredRank !== null || i.isPopular)
    .sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
    .slice(0, MAX_BESTSELLERS)
    .map((i) => i.id);
}

export interface WoltComparison {
  /** Items sold on both channels. */
  compared: number;
  cheaperOnSite: number;
  pricierOnSite: number;
  /** Biggest saving on a single variant, in qəpik. */
  maxSaving: number;
}

/** Compares site vs Wolt prices of items sold on both channels. */
export function compareWithWolt(data: MenuData): WoltComparison {
  const result: WoltComparison = { compared: 0, cheaperOnSite: 0, pricierOnSite: 0, maxSaving: 0 };
  for (const item of data.items) {
    if (!item.availableSite || !item.availableWolt || item.isHidden) continue;
    for (const v of item.variants) {
      if (!v.isAvailable || v.priceWolt === null) continue;
      result.compared++;
      if (v.priceSite < v.priceWolt) {
        result.cheaperOnSite++;
        result.maxSaving = Math.max(result.maxSaving, v.priceWolt - v.priceSite);
      } else if (v.priceSite > v.priceWolt) {
        result.pricierOnSite++;
      }
    }
  }
  return result;
}

/** The "Wolt-dan ucuz" banner is only honest when nothing costs more on the site. */
export function shouldShowWoltBanner(settings: RestaurantSettings, comparison: WoltComparison): boolean {
  return settings.woltBannerEnabled && comparison.cheaperOnSite > 0 && comparison.pricierOnSite === 0;
}

export function buildPublicSettings(s: RestaurantSettings, zones: DeliveryZone[], locale: Locale): PublicSettings {
  return {
    name: s.name,
    phone: s.phone,
    whatsapp: s.whatsapp,
    instagram: s.instagram,
    address: localize(s.address, locale),
    lat: s.lat,
    lng: s.lng,
    googleMapsUrl: s.googleMapsUrl,
    timezone: s.timezone,
    openingHours: s.openingHours,
    pickupEnabled: s.pickupEnabled,
    deliveryEnabled: s.deliveryEnabled,
    preorderEnabled: s.preorderEnabled,
    orderingEnabled: s.orderingEnabled,
    cashbackPercent: s.cashbackPercent,
    heroImageUrl: s.heroImageUrl,
    zones: zones
      .filter((z) => z.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((z) => ({
        id: z.id,
        name: localize(z.name, locale),
        radiusKm: z.radiusKm,
        fee: z.fee,
        minOrder: z.minOrder,
        etaMinutes: z.etaMinutes,
      })),
  };
}
