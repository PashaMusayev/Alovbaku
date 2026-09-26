import "server-only";
import { createHash } from "node:crypto";
import { buildPublicMenu, buildPublicSettings } from "@/lib/menu/public-menu";
import { getDeliveryZones, getMenuData, getSettings } from "@/lib/menu/repository";
import { getOnlinePaymentProvider } from "@/lib/payments";
import { normalizeAzPhone } from "@/lib/phone";
import { isTelegramConfigured, sendOrderToTelegram } from "@/lib/notify/telegram";
import { formatOrderForStaff } from "./format";
import { computeQuote, type QuoteError } from "./quote";
import type { OrderRequest } from "./schema";
import { createOrder, getTelegramChatId, hitRateLimit, setTelegramMessage } from "./store";
import type { OrderRecord } from "./types";

export type PlaceOrderResult =
  | { ok: true; order: OrderRecord; notified: boolean; whatsappText: string }
  | { ok: false; status: 400 | 422 | 429; error: "invalid_phone" | "address_required" | "payment_unavailable" | "rate_limited" }
  | { ok: false; status: 422; error: "quote"; codes: QuoteError[]; invalidLines: number[] };

/** Per 10 minutes. Generous enough for a family re-ordering, tight enough to stop floods. */
const RATE_WINDOW_SECONDS = 600;
const MAX_PER_IP = 6;
const MAX_PER_PHONE = 4;

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);

export async function placeOrder(input: OrderRequest, clientIp: string, now = new Date()): Promise<PlaceOrderResult> {
  const phone = normalizeAzPhone(input.phone);
  if (!phone) return { ok: false, status: 400, error: "invalid_phone" };
  if (input.fulfillment === "delivery" && (!input.address || input.address.length < 5)) {
    return { ok: false, status: 400, error: "address_required" };
  }

  const [ipAllowed, phoneAllowed] = await Promise.all([
    hitRateLimit(`order:ip:${hash(clientIp)}`, RATE_WINDOW_SECONDS, MAX_PER_IP),
    hitRateLimit(`order:phone:${hash(phone)}`, RATE_WINDOW_SECONDS, MAX_PER_PHONE),
  ]);
  if (!ipAllowed || !phoneAllowed) return { ok: false, status: 429, error: "rate_limited" };

  // Fresh data from the database — never trust prices or totals from the browser.
  const [data, settings, zones] = await Promise.all([getMenuData(), getSettings(), getDeliveryZones()]);
  if (input.paymentMethod === "online" && !(settings.onlinePaymentEnabled && getOnlinePaymentProvider())) {
    return { ok: false, status: 422, error: "payment_unavailable" };
  }

  // Staff see Azerbaijani names; prices are identical in every language.
  const menu = buildPublicMenu(data, "az");
  const publicSettings = buildPublicSettings(settings, zones, "az");
  const quote = computeQuote(menu, publicSettings, { ...input, lines: input.lines }, now);
  if (quote.errors.length > 0) {
    return { ok: false, status: 422, error: "quote", codes: quote.errors, invalidLines: quote.invalidLines };
  }

  const addonName = (id: string) =>
    Object.values(menu.addonGroups)
      .flatMap((g) => g.options)
      .find((o) => o.id === id)?.name ?? "";

  const order = await createOrder({
    customerName: input.customerName,
    phone,
    fulfillment: input.fulfillment,
    address: input.fulfillment === "delivery" ? input.address : null,
    addressNotes: input.fulfillment === "delivery" ? input.addressNotes : null,
    lat: input.fulfillment === "delivery" ? (input.lat ?? null) : null,
    lng: input.fulfillment === "delivery" ? (input.lng ?? null) : null,
    zoneId: quote.zone?.id ?? null,
    paymentMethod: input.paymentMethod,
    subtotal: quote.subtotal,
    deliveryFee: quote.deliveryFee,
    discount: quote.discount,
    total: quote.total,
    notes: input.notes,
    scheduledFor: input.scheduledFor ?? null,
    locale: input.locale,
    items: quote.lines.map((l) => {
      const item = menu.items[l.itemId];
      const variant = item.variants.find((v) => v.id === l.variantId);
      return {
        itemId: l.itemId,
        variantId: l.variantId,
        itemName: item.name,
        variantLabel: item.variants.length > 1 ? (variant?.label ?? null) : null,
        addons: l.addonIds.map(addonName).filter(Boolean),
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      };
    }),
  });

  console.info(`[order] #${order.number} created (id ${order.id}, ${order.fulfillment}, ${order.total} qəpik)`);

  let notified = false;
  if (isTelegramConfigured()) {
    try {
      const chatId = await getTelegramChatId();
      if (chatId) {
        const messageId = await sendOrderToTelegram(order, chatId);
        notified = true;
        await setTelegramMessage(order.id, chatId, messageId).catch((e) => console.error("[order] saving Telegram message id failed", e));
      }
    } catch (error) {
      // The order is saved; the customer gets the WhatsApp fallback button.
      console.error("[order] Telegram notification failed", error);
    }
  }

  return { ok: true, order, notified, whatsappText: formatOrderForStaff(order, { html: false }) };
}
