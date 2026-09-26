"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "./config";
import { localePath } from "./config";
import { format, type Dictionary } from "./index";
import { tr } from "@/lib/localize";
import type { LocalizedText } from "@/lib/types";

interface I18nValue {
  locale: Locale;
  dict: Dictionary;
  /** Interpolate a dictionary string: f(dict.menu.from, { price }) */
  f: typeof format;
  /** Localized DB text with Azerbaijani fallback. */
  l: (text: LocalizedText | null | undefined) => string;
  /** Locale-aware internal link. */
  href: (path: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dict,
      f: format,
      l: (text) => tr(text, locale),
      href: (path) => localePath(locale, path),
    }),
    [locale, dict],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
