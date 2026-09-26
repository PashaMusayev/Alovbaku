import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/az";
import az from "./dictionaries/az";
import ru from "./dictionaries/ru";
import en from "./dictionaries/en";

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = { az, ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replaces `{name}` placeholders in a translated string. */
export function format(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}
