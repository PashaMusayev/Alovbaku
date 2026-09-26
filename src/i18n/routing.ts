import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/types";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // Azerbaijani lives at "/", Russian at "/ru", English at "/en".
  localePrefix: "as-needed",
  // Always start in Azerbaijani; visitors switch language explicitly.
  localeDetection: false,
});
