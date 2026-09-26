import type { Qepik } from "./types";

export const CURRENCY_SYMBOL = "₼";

/** Converts a decimal manat amount (e.g. 4.1) to integer qəpik (410). */
export function azn(amount: number): Qepik {
  return Math.round(amount * 100);
}

/**
 * Formats qəpik as Azerbaijani currency: 870 → "8,70 ₼".
 * Always two decimals and a decimal comma, regardless of UI language,
 * so prices look identical everywhere (menu, receipts, Telegram).
 */
export function formatPrice(qepik: Qepik): string {
  const negative = qepik < 0;
  const abs = Math.abs(Math.round(qepik));
  const manat = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  const grouped = String(manat).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${negative ? "−" : ""}${grouped},${rest} ${CURRENCY_SYMBOL}`;
}

/** Parses user input like "8,70", "8.7" or "8" into qəpik. Returns null if invalid. */
export function parsePrice(input: string): Qepik | null {
  const normalized = input.trim().replace(/\s|₼/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return azn(Number(normalized));
}
