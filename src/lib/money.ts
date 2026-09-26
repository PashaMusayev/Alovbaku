/** Currency helpers. All amounts are integer qəpik (1 ₼ = 100 qəpik). */

const NBSP = " ";

/**
 * Formats qəpik as the restaurant's canonical price format: `8,70 ₼`.
 * Same format in every UI language (comma decimal separator, symbol after).
 */
export function formatPrice(qepik: number): string {
  const sign = qepik < 0 ? "-" : "";
  const abs = Math.abs(Math.round(qepik));
  const manat = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  const manatStr = String(manat).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${sign}${manatStr},${rest}${NBSP}₼`;
}

/** 8.7 → 870. Rounds to the nearest qəpik. */
export function toQepik(manat: number): number {
  return Math.round(manat * 100);
}

/** "8,70" / "8.70" / "8" → 870; null when not a valid amount. */
export function parsePriceInput(input: string): number | null {
  const normalized = input.replace(/\s|₼/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return toQepik(Number(normalized));
}
