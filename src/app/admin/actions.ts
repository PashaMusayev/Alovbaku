"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { loginAdmin, logoutAdmin, requireAdmin, type LoginResult } from "@/lib/admin/auth";
import {
  AdminDataError,
  deleteItem,
  reorder,
  saveAddonOptions,
  saveCategory,
  saveItem,
  setComboStatus,
  setItemFlags,
  uploadMenuImage,
} from "@/lib/admin/menu-admin";
import { savePrivateSettings, saveSettings, saveZones } from "@/lib/admin/settings-admin";
import { updateTelegramOrderMessage } from "@/lib/notify/telegram";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { updateOrderStatus } from "@/lib/orders/store";
import { ITEM_TAGS } from "@/lib/types";

export type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string; fields?: string[] };

/** Public pages are cached; refresh them after every menu/settings change. */
const refreshSite = () => revalidatePath("/", "layout");

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error; // redirects
    console.error("[admin action]", error);
    return { ok: false, error: error instanceof AdminDataError ? error.message : "server_error" };
  }
}

function invalid(error: z.ZodError): ActionResult<never> {
  return { ok: false, error: "invalid", fields: [...new Set(error.issues.map((i) => i.path.join(".")))] };
}

const localized = z.object({
  az: z.string().trim().max(300),
  ru: z.string().trim().max(300).optional(),
  en: z.string().trim().max(300).optional(),
});
const requiredLocalized = localized.extend({ az: z.string().trim().min(1).max(300) });
const money = z.number().int().min(0).max(100_000_00);

/* --------------------------------- auth --------------------------------- */

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const result = await loginAdmin(email, password);
  if (result.ok) redirect("/admin");
  return result;
}

export async function logoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin/login");
}

/* -------------------------------- orders -------------------------------- */

export async function setOrderStatusAction(orderId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ orderId: z.uuid(), status: z.enum(ORDER_STATUSES) }).safeParse({ orderId, status });
  if (!parsed.success) return invalid(parsed.error);
  return run(async () => {
    const result = await updateOrderStatus(parsed.data.orderId, parsed.data.status);
    if (!result.ok) throw new AdminDataError(result.reason);
    const { order } = result;
    if (order.telegramChatId && order.telegramMessageId) {
      // Keep the staff group's message (and its buttons) in sync with the admin panel.
      await updateTelegramOrderMessage(order, order.telegramChatId, order.telegramMessageId).catch((e) =>
        console.error("[admin] Telegram message update failed", e),
      );
    }
    return undefined;
  });
}

/* --------------------------------- menu --------------------------------- */

const itemSchema = z.object({
  id: z.uuid().optional(),
  categoryId: z.uuid(),
  name: requiredLocalized,
  description: localized,
  imageUrl: z.string().max(3_000_000).nullable(),
  tags: z.array(z.enum(ITEM_TAGS)).max(ITEM_TAGS.length),
  isPopular: z.boolean(),
  isNew: z.boolean(),
  isHidden: z.boolean(),
  inStock: z.boolean(),
  featuredRank: z.number().int().min(1).max(99).nullable(),
  needsReview: z.boolean(),
  reviewNote: z.string().trim().max(500).nullable(),
  isCombo: z.boolean(),
  variants: z
    .array(z.object({ id: z.uuid().optional(), label: localized.nullable(), price: money, isAvailable: z.boolean() }))
    .min(1)
    .max(20),
  addonGroupIds: z.array(z.uuid()).max(20),
});

export async function saveItemAction(input: unknown): Promise<ActionResult<string>> {
  await requireAdmin();
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = {
    ...parsed.data,
    // A blank variant label means "no label".
    variants: parsed.data.variants.map((v) => ({ ...v, label: v.label?.az ? v.label : null })),
  };
  const res = await run(() => saveItem(data));
  if (res.ok) refreshSite();
  return res;
}

export async function setItemFlagsAction(
  id: string,
  flags: { inStock?: boolean; isHidden?: boolean; needsReview?: boolean },
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), flags: z.object({ inStock: z.boolean().optional(), isHidden: z.boolean().optional(), needsReview: z.boolean().optional() }) })
    .safeParse({ id, flags });
  if (!parsed.success) return invalid(parsed.error);
  const res = await run(() => setItemFlags(parsed.data.id, parsed.data.flags));
  if (res.ok) refreshSite();
  return res;
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid" };
  const res = await run(() => deleteItem(id));
  if (res.ok) refreshSite();
  return res;
}

export async function reorderAction(table: "categories" | "menu_items", ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ table: z.enum(["categories", "menu_items"]), ids: z.array(z.uuid()).max(500) }).safeParse({ table, ids });
  if (!parsed.success) return invalid(parsed.error);
  const res = await run(() => reorder(parsed.data.table, parsed.data.ids));
  if (res.ok) refreshSite();
  return res;
}

export async function saveCategoryAction(input: unknown): Promise<ActionResult<string>> {
  await requireAdmin();
  const parsed = z
    .object({ id: z.uuid().optional(), name: requiredLocalized, icon: z.string().trim().min(1).max(16), isVisible: z.boolean() })
    .safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const res = await run(() => saveCategory(parsed.data));
  if (res.ok) refreshSite();
  return res;
}

export async function saveAddonOptionsAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .array(z.object({ id: z.uuid(), name: requiredLocalized, price: money, isAvailable: z.boolean() }))
    .max(200)
    .safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const res = await run(() => saveAddonOptions(parsed.data));
  if (res.ok) refreshSite();
  return res;
}

export async function setComboStatusAction(comboId: string, status: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.object({ comboId: z.uuid(), status: z.enum(["active", "draft", "archived"]) }).safeParse({ comboId, status });
  if (!parsed.success) return invalid(parsed.error);
  const res = await run(() => setComboStatus(parsed.data.comboId, parsed.data.status));
  if (res.ok) refreshSite();
  return res;
}

const MAX_IMAGE_BYTES = 1_500_000;

/** Receives an image already cropped to 4:3 and compressed to WebP in the browser. */
export async function uploadImageAction(formData: FormData): Promise<ActionResult<string>> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "invalid" };
  if (!["image/webp", "image/jpeg", "image/png"].includes(file.type) || file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "invalid" };
  }
  return run(async () => uploadMenuImage(new Uint8Array(await file.arrayBuffer()), file.type));
}

/* ------------------------------- settings ------------------------------- */

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const settingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().regex(/^\+994\d{9}$/),
  whatsapp: z.string().regex(/^\+994\d{9}$/),
  instagram: z.string().trim().max(60),
  address: requiredLocalized,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  googleMapsUrl: z.string().trim().max(500),
  mapEmbedQuery: z.string().trim().min(1).max(200),
  googleReviewUrl: z.string().trim().max(500),
  timezone: z.string().min(1),
  openingHours: z.array(z.object({ day: z.number().int().min(0).max(6), open: hhmm, close: hhmm, closed: z.boolean() })).length(7),
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  preorderEnabled: z.boolean(),
  orderingEnabled: z.boolean(),
  cashbackPercent: z.number().min(0).max(100),
  heroImageUrl: z.string().nullable(),
  aiAssistantEnabled: z.boolean(),
  onlinePaymentEnabled: z.boolean(),
});

const zonesSchema = z
  .array(
    z.object({
      id: z.uuid().optional(),
      name: requiredLocalized,
      radiusKm: z.number().positive().max(200),
      fee: money,
      minOrder: money,
      etaMinutes: z.number().int().min(1).max(600),
      sortOrder: z.number().int(),
      isActive: z.boolean(),
    }),
  )
  .max(30);

const privateSchema = z.object({
  telegramChatId: z
    .string()
    .trim()
    .regex(/^-?\d{3,20}$/)
    .nullable(),
  priceOutlierFactor: z.number().min(1.1).max(10),
});

export async function saveAllSettingsAction(input: { settings: unknown; zones: unknown; privateSettings: unknown }): Promise<ActionResult> {
  await requireAdmin();
  const s = settingsSchema.safeParse(input.settings);
  const z1 = zonesSchema.safeParse(input.zones);
  const p = privateSchema.safeParse(input.privateSettings);
  const fields = [
    ...(s.success ? [] : s.error.issues.map((i) => `settings.${i.path.join(".")}`)),
    ...(z1.success ? [] : z1.error.issues.map((i) => `zones.${i.path.join(".")}`)),
    ...(p.success ? [] : p.error.issues.map((i) => `private.${i.path.join(".")}`)),
  ];
  if (!s.success || !z1.success || !p.success) return { ok: false, error: "invalid", fields };
  const res = await run(async () => {
    await saveSettings(s.data);
    await saveZones(z1.data);
    await savePrivateSettings(p.data);
    return undefined;
  });
  if (res.ok) refreshSite();
  return res;
}
