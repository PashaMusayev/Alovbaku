import "server-only";
import { randomUUID } from "node:crypto";
import { memoryDb } from "@/lib/data/memory-db";
import { slugify, uniqueSlug } from "./slug";
import { getServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ComboStatus, ItemTag, LocalizedText, MenuItem } from "@/lib/types";

/**
 * Menu mutations for the admin panel. Callers must have checked requireAdmin().
 * Supabase (service role) in production, the in-memory database otherwise.
 */

export class AdminDataError extends Error {}

const supabase = () => isSupabaseConfigured();

function check<T extends { error: { message: string } | null }>(res: T): T {
  if (res.error) throw new AdminDataError(res.error.message);
  return res;
}

export interface AdminVariantInput {
  id?: string;
  label: LocalizedText | null;
  price: number;
  isAvailable: boolean;
}

export interface AdminItemInput {
  id?: string;
  categoryId: string;
  name: LocalizedText;
  description: LocalizedText;
  imageUrl: string | null;
  tags: ItemTag[];
  isPopular: boolean;
  isNew: boolean;
  isHidden: boolean;
  inStock: boolean;
  featuredRank: number | null;
  needsReview: boolean;
  reviewNote: string | null;
  isCombo: boolean;
  variants: AdminVariantInput[];
  addonGroupIds: string[];
}

async function existingItems(): Promise<Pick<MenuItem, "id" | "slug" | "variants">[]> {
  if (!supabase()) return memoryDb().menu.items;
  const res = check(await getServiceClient().from("menu_items").select("id, slug, item_variants(id)"));
  return (res.data as { id: string; slug: string; item_variants: { id: string }[] }[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    variants: r.item_variants.map((v) => ({ id: v.id }) as MenuItem["variants"][number]),
  }));
}

/** Creates or updates an item with its variants and add-on groups. Returns the item id. */
export async function saveItem(input: AdminItemInput): Promise<string> {
  const items = await existingItems();
  const current = input.id ? items.find((i) => i.id === input.id) : undefined;
  if (input.id && !current) throw new AdminDataError("Məhsul tapılmadı");
  // Only keep variant ids that really belong to this item.
  const ownVariantIds = new Set(current?.variants.map((v) => v.id) ?? []);
  const variants = input.variants.map((v) => ({ ...v, id: v.id && ownVariantIds.has(v.id) ? v.id : undefined }));
  const slug = current?.slug ?? uniqueSlug(slugify(input.name.az), new Set(items.map((i) => i.slug)));

  if (!supabase()) {
    const db = memoryDb().menu;
    const id = current?.id ?? randomUUID();
    const existing = db.items.find((i) => i.id === id);
    const sortOrder =
      existing?.sortOrder ??
      Math.max(0, ...db.items.filter((i) => i.categoryId === input.categoryId).map((i) => i.sortOrder)) + 1;
    const item: MenuItem = {
      id,
      slug,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      imageUrl: input.imageUrl,
      tags: input.tags,
      isPopular: input.isPopular,
      isNew: input.isNew,
      isHidden: input.isHidden,
      inStock: input.inStock,
      featuredRank: input.featuredRank,
      sortOrder,
      needsReview: input.needsReview,
      reviewNote: input.reviewNote,
      isCombo: input.isCombo,
      variants: variants.map((v, i) => ({
        id: v.id ?? randomUUID(),
        label: v.label,
        price: v.price,
        sortOrder: i + 1,
        isAvailable: v.isAvailable,
      })),
      addonGroupIds: input.addonGroupIds,
    };
    db.items = existing ? db.items.map((i) => (i.id === id ? item : i)) : [...db.items, item];
    return id;
  }

  const res = check(
    await getServiceClient().rpc("admin_save_item", {
      p: {
        id: current?.id ?? null,
        slug,
        category_id: input.categoryId,
        name: input.name,
        description: input.description,
        image_url: input.imageUrl,
        tags: input.tags,
        is_popular: input.isPopular,
        is_new: input.isNew,
        is_hidden: input.isHidden,
        in_stock: input.inStock,
        featured_rank: input.featuredRank,
        needs_review: input.needsReview,
        review_note: input.reviewNote,
        is_combo: input.isCombo,
        variants: variants.map((v) => ({ id: v.id ?? null, label: v.label, price: v.price, is_available: v.isAvailable })),
        addon_group_ids: input.addonGroupIds,
      },
    }),
  );
  return res.data as string;
}

export interface ItemFlags {
  inStock?: boolean;
  isHidden?: boolean;
  needsReview?: boolean;
}

/** One-tap toggles from the menu list ("stokda yoxdur", hide, mark reviewed). */
export async function setItemFlags(id: string, flags: ItemFlags): Promise<void> {
  if (!supabase()) {
    const db = memoryDb().menu;
    db.items = db.items.map((i) =>
      i.id === id
        ? {
            ...i,
            ...flags,
            reviewNote: flags.needsReview === false ? null : i.reviewNote,
          }
        : i,
    );
    return;
  }
  const patch: Record<string, unknown> = {};
  if (flags.inStock !== undefined) patch.in_stock = flags.inStock;
  if (flags.isHidden !== undefined) patch.is_hidden = flags.isHidden;
  if (flags.needsReview !== undefined) {
    patch.needs_review = flags.needsReview;
    if (!flags.needsReview) patch.review_note = null;
  }
  check(await getServiceClient().from("menu_items").update(patch).eq("id", id));
}

export async function deleteItem(id: string): Promise<void> {
  if (!supabase()) {
    const db = memoryDb().menu;
    db.items = db.items.filter((i) => i.id !== id);
    db.combos = db.combos.filter((c) => c.itemId !== id);
    return;
  }
  check(await getServiceClient().from("menu_items").delete().eq("id", id));
}

/** Drag & drop ordering: ids in their new order. */
export async function reorder(table: "categories" | "menu_items", ids: string[]): Promise<void> {
  if (!supabase()) {
    const db = memoryDb().menu;
    const pos = new Map(ids.map((id, i) => [id, i + 1]));
    if (table === "categories") db.categories = db.categories.map((c) => ({ ...c, sortOrder: pos.get(c.id) ?? c.sortOrder }));
    else db.items = db.items.map((i) => ({ ...i, sortOrder: pos.get(i.id) ?? i.sortOrder }));
    return;
  }
  check(await getServiceClient().rpc("admin_reorder", { p_table: table, p_ids: ids }));
}

export interface AdminCategoryInput {
  id?: string;
  name: LocalizedText;
  icon: string;
  isVisible: boolean;
}

export async function saveCategory(input: AdminCategoryInput): Promise<string> {
  if (!supabase()) {
    const db = memoryDb().menu;
    if (input.id) {
      db.categories = db.categories.map((c) => (c.id === input.id ? { ...c, name: input.name, icon: input.icon, isVisible: input.isVisible } : c));
      return input.id;
    }
    const id = randomUUID();
    const taken = new Set(db.categories.map((c) => c.slug));
    db.categories.push({
      id,
      slug: uniqueSlug(slugify(input.name.az), taken),
      name: input.name,
      icon: input.icon,
      isVisible: input.isVisible,
      sortOrder: Math.max(0, ...db.categories.map((c) => c.sortOrder)) + 1,
    });
    return id;
  }
  const db = getServiceClient();
  if (input.id) {
    check(await db.from("categories").update({ name: input.name, icon: input.icon, is_visible: input.isVisible }).eq("id", input.id));
    return input.id;
  }
  const all = check(await db.from("categories").select("slug, sort_order")).data as { slug: string; sort_order: number }[];
  const res = check(
    await db
      .from("categories")
      .insert({
        slug: uniqueSlug(slugify(input.name.az), new Set(all.map((c) => c.slug))),
        name: input.name,
        icon: input.icon,
        is_visible: input.isVisible,
        sort_order: Math.max(0, ...all.map((c) => c.sort_order)) + 1,
      })
      .select("id")
      .single(),
  );
  return (res.data as { id: string }).id;
}

export interface AddonOptionInput {
  id: string;
  name: LocalizedText;
  price: number;
  isAvailable: boolean;
}

export async function saveAddonOptions(options: AddonOptionInput[]): Promise<void> {
  if (!supabase()) {
    const db = memoryDb().menu;
    const byId = new Map(options.map((o) => [o.id, o]));
    db.addonGroups = db.addonGroups.map((g) => ({
      ...g,
      options: g.options.map((o) => {
        const u = byId.get(o.id);
        return u ? { ...o, name: u.name, price: u.price, isAvailable: u.isAvailable } : o;
      }),
    }));
    return;
  }
  const db = getServiceClient();
  for (const o of options) {
    check(await db.from("addon_options").update({ name: o.name, price: o.price, is_available: o.isAvailable }).eq("id", o.id));
  }
}

export async function setComboStatus(comboId: string, status: ComboStatus): Promise<void> {
  if (!supabase()) {
    const db = memoryDb().menu;
    const combo = db.combos.find((c) => c.id === comboId);
    db.combos = db.combos.map((c) => (c.id === comboId ? { ...c, status } : c));
    // An active combo must be visible on the menu, a draft/archived one hidden.
    if (combo) db.items = db.items.map((i) => (i.id === combo.itemId ? { ...i, isHidden: status !== "active" } : i));
    return;
  }
  const db = getServiceClient();
  const res = check(await db.from("combos").update({ status }).eq("id", comboId).select("item_id").single());
  check(await db.from("menu_items").update({ is_hidden: status !== "active" }).eq("id", (res.data as { item_id: string }).item_id));
}

const IMAGE_BUCKET = "menu-images";

/** Stores an already cropped/compressed WebP and returns its public URL. */
export async function uploadMenuImage(bytes: Uint8Array, contentType: string): Promise<string> {
  if (!supabase()) {
    // Demo mode: keep the image inline (lost on restart, fine for local testing).
    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  }
  const path = `items/${randomUUID()}.webp`;
  const db = getServiceClient();
  check(await db.storage.from(IMAGE_BUCKET).upload(path, bytes, { contentType, cacheControl: "31536000", upsert: false }));
  return db.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
