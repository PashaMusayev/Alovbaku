import "server-only";
import { timingSafeEqual } from "node:crypto";

/** TELEGRAM_WEBHOOK_SECRET without stray spaces/newlines pasted into the dashboard. */
export function webhookSecret(): string | null {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || null;
}

/** Constant-time check against TELEGRAM_WEBHOOK_SECRET. */
export function matchesWebhookSecret(value: string | null): boolean {
  const secret = webhookSecret();
  if (!secret || !value) return false;
  const a = Buffer.from(value.trim());
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
