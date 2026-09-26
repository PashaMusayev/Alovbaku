import type { Metadata } from "next";
import { localePath, locales, localeTags, type Locale } from "@/i18n/config";

/** Canonical + hreflang alternates for a path in every locale. */
export function alternatesFor(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [localeTags[l], localePath(l, path)])),
      "x-default": localePath("az", path),
    },
  };
}
