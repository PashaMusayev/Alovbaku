import "server-only";
import { nextStatuses, type OrderStatus } from "@/lib/orders/status";
import { formatOrderForStaff, staffActionLabel, staffStatusLabel } from "@/lib/orders/format";
import type { OrderRecord } from "@/lib/orders/types";

const API = "https://api.telegram.org";
const TIMEOUT_MS = 6000;

export const isTelegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

async function call<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method} failed: ${json.description ?? res.status}`);
  return json.result;
}

const STATUS_EMOJI: Partial<Record<OrderStatus, string>> = {
  accepted: "✅",
  rejected: "❌",
  preparing: "🔥",
  on_the_way: "🛵",
  ready: "📦",
  delivered: "🏁",
  cancelled: "🚫",
};

/** callback_data format: "st:<orderId>:<status>" (≤ 64 bytes). */
export const statusCallback = (orderId: string, status: OrderStatus) => `st:${orderId}:${status}`;

export function parseStatusCallback(data: string): { orderId: string; status: OrderStatus } | null {
  const m = /^st:([0-9a-f-]{36}):([a-z_]+)$/.exec(data);
  return m ? { orderId: m[1], status: m[2] as OrderStatus } : null;
}

export function orderKeyboard(order: OrderRecord) {
  const buttons = nextStatuses(order.status, order.fulfillment).map((s) => ({
    text: `${STATUS_EMOJI[s] ?? ""} ${staffActionLabel(s)}`.trim(),
    callback_data: statusCallback(order.id, s),
  }));
  const rows = buttons.length ? [buttons] : [];
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site?.startsWith("https://")) rows.push([{ text: "🖥 Admin", url: `${site}/admin/orders/${order.id}` } as never]);
  return { inline_keyboard: rows };
}

function messageText(order: OrderRecord): string {
  const status = order.status === "new" ? "" : `\n\n<b>${STATUS_EMOJI[order.status] ?? ""} ${staffStatusLabel(order.status)}</b>`;
  return formatOrderForStaff(order, { html: true }) + status;
}

export async function sendOrderToTelegram(order: OrderRecord, chatId: string): Promise<void> {
  await call("sendMessage", {
    chat_id: chatId,
    text: messageText(order),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: orderKeyboard(order),
  });
}

/** Refreshes the order message after a status change (new status line + next buttons). */
export async function updateTelegramOrderMessage(order: OrderRecord, chatId: string | number, messageId: number) {
  await call("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: messageText(order),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: orderKeyboard(order),
  });
}

/** Shows a short toast on the staff member's phone. Never throws. */
export async function answerCallback(callbackQueryId: string, text: string) {
  try {
    await call("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
  } catch (error) {
    console.error("[telegram] answerCallbackQuery failed", error);
  }
}
