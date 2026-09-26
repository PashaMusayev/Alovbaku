/** "+994552437999" → "+994 55 243 79 99" */
export function formatPhone(e164: string): string {
  const m = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

export const telHref = (e164: string) => `tel:${e164}`;
export const whatsappHref = (e164: string, text?: string) =>
  `https://wa.me/${e164.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export const instagramHref = (handle: string) => `https://instagram.com/${handle.replace(/^@/, "")}`;

/** Azerbaijani mobile operator codes (Azercell 10/50/51, Bakcell 55/99, Nar 70/77, Naxtel 60) and Baku landline 12. */
const AZ_PREFIXES = new Set(["10", "50", "51", "55", "60", "70", "77", "99", "12"]);

/**
 * Accepts "055 243 79 99", "55 243 79 99", "+994 55 243 79 99", "994552437999"…
 * Returns E.164 ("+994552437999") or null when it is not a valid Azerbaijani number.
 */
export function normalizeAzPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("994")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 9 || !AZ_PREFIXES.has(digits.slice(0, 2))) return null;
  return `+994${digits}`;
}

/** Formats the 9 national digits while typing: "552437999" → "55 243 79 99". */
export function formatNationalInput(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
}
