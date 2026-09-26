export const locales = ["az", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "az";

export const localeLabels: Record<Locale, string> = {
  az: "AZ",
  ru: "RU",
  en: "EN",
};

/** BCP-47 tags used for Intl formatting and <html lang>. */
export const localeTags: Record<Locale, string> = {
  az: "az-AZ",
  ru: "ru-RU",
  en: "en-US",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/**
 * Builds a public path for a locale. Azerbaijani lives at the root
 * ("/menu"), other languages are prefixed ("/ru/menu").
 */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
