// Connects the Telegram bot to the site so the Accept/Reject/status buttons work.
// Usage (after deploying):
//   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/telegram-setup.mjs https://your-domain.az
// Also prints the chat IDs the bot has seen, to fill TELEGRAM_CHAT_ID
// (add the bot to the staff group and send any message there first).
const [siteUrl] = process.argv.slice(2);
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN");
const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

if (!siteUrl) {
  const updates = await api("getUpdates");
  const chats = new Map();
  for (const u of updates.result ?? []) {
    const chat = u.message?.chat ?? u.my_chat_member?.chat;
    if (chat) chats.set(chat.id, chat.title ?? chat.username ?? chat.first_name);
  }
  console.log(chats.size ? "Chats seen by the bot (use the group's id as TELEGRAM_CHAT_ID):" : "No chats yet — add the bot to the group and send a message there.");
  for (const [id, title] of chats) console.log(`  ${id}\t${title}`);
} else {
  if (!secret) throw new Error("Set TELEGRAM_WEBHOOK_SECRET (any long random string, same as on the server)");
  const res = await api("setWebhook", {
    url: `${siteUrl.replace(/\/$/, "")}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["callback_query"],
  });
  console.log(res.ok ? "Webhook set ✓" : res);
}
