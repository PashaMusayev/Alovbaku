import type { Locale, LocalizedText } from "./types";

/** Returns the text in the requested language, falling back to Azerbaijani. */
export function localize(text: LocalizedText | null | undefined, locale: Locale): string {
  if (!text) return "";
  const value = text[locale];
  return value && value.trim() !== "" ? value : text.az;
}
