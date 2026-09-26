"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("languages");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={tNav("language")} className="flex rounded-full bg-coal-800 p-0.5 text-xs font-semibold">
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className={`grid h-11 min-w-11 place-items-center rounded-full px-2 uppercase transition-colors ${
            l === locale ? "bg-cream-100 text-coal-950" : "text-cream-300 hover:text-cream-50"
          }`}
        >
          {l}
          <span className="sr-only"> — {t(l)}</span>
        </Link>
      ))}
    </nav>
  );
}
