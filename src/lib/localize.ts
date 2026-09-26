import type { Locale } from "@/i18n/config";
import type { LocalizedText } from "./types";

/** Picks the text for a locale, falling back to Azerbaijani. */
export function tr(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return "";
  const value = text[locale];
  return value && value.trim() ? value : text.az;
}
