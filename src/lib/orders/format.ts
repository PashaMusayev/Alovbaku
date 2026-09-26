import { createTranslator } from "next-intl";
import staffMessages from "../../../messages/az.json";
import { formatPhone } from "@/lib/phone";
import { formatPrice } from "@/lib/money";
import type { OrderStatus } from "./status";
import type { OrderRecord } from "./types";

/** Staff-facing texts (Telegram, WhatsApp, kitchen) are always in Azerbaijani. */
const t = createTranslator({ locale: "az", messages: staffMessages, namespace: "staff" });

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function staffStatusLabel(status: OrderStatus): string {
  return t(`status.${status}`);
}

/** Button label for moving an order to `status` ("Qəbul et", "Yoldadır"…). */
export function staffActionLabel(status: OrderStatus): string {
  return t(`action.${status}`);
}

export function formatDateTime(iso: string, timeZone = "Asia/Baku"): string {
  return new Intl.DateTimeFormat("az-AZ", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function mapLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * Order summary for the restaurant. `html` = Telegram HTML parse mode,
 * otherwise plain text (WhatsApp).
 */
export function formatOrderForStaff(order: OrderRecord, { html }: { html: boolean }): string {
  const e = html ? escapeHtml : (s: string) => s;
  const b = (s: string) => (html ? `<b>${s}</b>` : `*${s}*`);
  const lines: string[] = [];

  lines.push(`🔥 ${b(t("newOrder", { number: order.number }))}`);
  lines.push(order.fulfillment === "delivery" ? `🛵 ${t("delivery")}` : `🏃 ${t("pickup")}`);
  if (order.scheduledFor) lines.push(`⏰ ${b(t("scheduledFor", { time: formatDateTime(order.scheduledFor) }))}`);
  lines.push("");

  for (const item of order.items) {
    const variant = item.variantLabel ? ` (${e(item.variantLabel)})` : "";
    const addons = item.addons.length ? ` + ${e(item.addons.join(", "))}` : "";
    lines.push(`${item.quantity} × ${e(item.itemName)}${variant}${addons} — ${formatPrice(item.lineTotal)}`);
  }
  lines.push("");
  lines.push(`${t("subtotal")}: ${formatPrice(order.subtotal)}`);
  if (order.fulfillment === "delivery") {
    lines.push(`${t("deliveryFee")}: ${order.deliveryFee === 0 ? t("free") : formatPrice(order.deliveryFee)}`);
  }
  if (order.discount > 0) lines.push(`${t("discount")}: −${formatPrice(order.discount)}`);
  lines.push(b(`${t("total")}: ${formatPrice(order.total)}`));
  lines.push(order.paymentMethod === "cash" ? `💵 ${t("payment.cash")}` : order.paymentMethod === "card_on_delivery" ? `💳 ${t("payment.card_on_delivery")}` : `🌐 ${t("payment.online")}`);
  lines.push("");

  lines.push(`👤 ${e(order.customerName)}`);
  lines.push(`📞 ${formatPhone(order.phone)}`);
  if (order.fulfillment === "delivery") {
    if (order.address) lines.push(`📍 ${e(order.address)}`);
    if (order.addressNotes) lines.push(`🏠 ${e(order.addressNotes)}`);
    if (order.lat != null && order.lng != null) lines.push(`🗺 ${mapLink(order.lat, order.lng)}`);
  }
  if (order.notes) lines.push(`📝 ${e(order.notes)}`);
  return lines.join("\n");
}
