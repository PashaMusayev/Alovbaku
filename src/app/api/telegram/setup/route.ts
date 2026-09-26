import { NextResponse, type NextRequest } from "next/server";
import { matchesWebhookSecret } from "@/lib/notify/secret";
import { isTelegramConfigured, telegramCall } from "@/lib/notify/telegram";
import { getTelegramChatId } from "@/lib/orders/store";

export const dynamic = "force-dynamic";

/**
 * One-time Telegram setup, run from the server (works even where api.telegram.org is
 * unreachable from the owner's browser):
 *   https://<site>/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>
 * Registers the button webhook and sends a test message to the staff group.
 */
export async function GET(req: NextRequest) {
  if (!matchesWebhookSecret(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ ok: false, error: "Açar (key) səhvdir və ya TELEGRAM_WEBHOOK_SECRET təyin edilməyib." }, { status: 401 });
  }
  if (!isTelegramConfigured()) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN təyin edilməyib." }, { status: 400 });
  }

  const webhookUrl = new URL("/api/telegram/webhook", req.nextUrl.origin).toString();
  const steps: Record<string, string> = {};
  try {
    await telegramCall("setWebhook", {
      url: webhookUrl,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["callback_query"],
      drop_pending_updates: true,
    });
    steps.webhook = `✅ ${webhookUrl}`;
  } catch (error) {
    steps.webhook = `❌ ${error instanceof Error ? error.message : String(error)}`;
  }

  const chatId = await getTelegramChatId();
  if (!chatId) {
    steps.testMessage = "❌ TELEGRAM_CHAT_ID təyin edilməyib.";
  } else {
    try {
      await telegramCall("sendMessage", {
        chat_id: chatId,
        text: "✅ Alov Baku sifariş botu qoşuldu. Yeni sifarişlər bu qrupa gələcək.",
      });
      steps.testMessage = `✅ Qrupa (${chatId}) test mesajı göndərildi`;
    } catch (error) {
      steps.testMessage = `❌ ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  const ok = Object.values(steps).every((s) => s.startsWith("✅"));
  return NextResponse.json({ ok, ...steps }, { status: ok ? 200 : 502 });
}
