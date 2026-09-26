import { NextResponse } from "next/server";
import { createTranslator } from "next-intl";
import staffMessages from "../../../../../messages/az.json";
import { matchesWebhookSecret } from "@/lib/notify/secret";
import { answerCallback, parseStatusCallback, updateTelegramOrderMessage } from "@/lib/notify/telegram";
import { staffStatusLabel } from "@/lib/orders/format";
import { getTelegramChatId, updateOrderStatus } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

const t = createTranslator({ locale: "az", messages: staffMessages, namespace: "staff" });

interface CallbackQuery {
  id: string;
  data?: string;
  message?: { message_id: number; chat: { id: number } };
}


/** Handles the Accept / Reject / status buttons on order messages in the staff group. */
export async function POST(req: Request) {
  if (!matchesWebhookSecret(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const update = (await req.json()) as { callback_query?: CallbackQuery };
  const cq = update.callback_query;
  if (!cq?.data || !cq.message) return NextResponse.json({ ok: true });

  const chatId = await getTelegramChatId();
  if (!chatId || String(cq.message.chat.id) !== String(chatId)) {
    await answerCallback(cq.id, t("forbidden"));
    return NextResponse.json({ ok: true });
  }

  const parsed = parseStatusCallback(cq.data);
  if (!parsed) return NextResponse.json({ ok: true });

  const result = await updateOrderStatus(parsed.orderId, parsed.status);
  if (!result.ok) {
    await answerCallback(cq.id, result.reason === "not_found" ? t("unknownOrder") : t("invalidTransition"));
    return NextResponse.json({ ok: true });
  }
  await Promise.allSettled([
    answerCallback(cq.id, t("statusUpdated", { status: staffStatusLabel(result.order.status) })),
    updateTelegramOrderMessage(result.order, cq.message.chat.id, cq.message.message_id),
  ]);
  return NextResponse.json({ ok: true });
}
