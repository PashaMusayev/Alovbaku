import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Constant-time check against TELEGRAM_WEBHOOK_SECRET. */
export function matchesWebhookSecret(value: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
