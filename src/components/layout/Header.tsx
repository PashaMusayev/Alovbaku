"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { defaultLocale, localeLabels, localePath, locales, type Locale } from "@/i18n/config";
import { PhoneIcon } from "@/components/ui/icons";
import { Logo } from "./Logo";

/** Strip the locale prefix from a browser path ("/ru/menu" → "/menu"). */
function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if ((locales as readonly string[]).includes(first)) return `/${rest.join("/")}`;
  return pathname || "/";
}

export function Header({ phone }: { phone: string }) {
  const { dict, locale, href } = useI18n();
  const pathname = usePathname() ?? "/";
  const basePath = stripLocale(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-coal-700/80 bg-coal-950/90 backdrop-blur supports-[backdrop-filter]:bg-coal-950/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-flame-500 focus:px-4 focus:py-2 focus:text-coal-950"
      >
        {dict.nav.skipToContent}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link href={href("/")} aria-label={dict.brand.name} className="shrink-0">
          <Logo subtitle={dict.brand.logoSubtitle} />
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label={dict.nav.language}>
          <Link href={href("/menu")} className="hidden font-semibold text-cream-200 hover:text-flame-300 sm:inline-block sm:px-3">
            {dict.nav.menu}
          </Link>
          <div className="flex rounded-full border border-coal-600 p-0.5 text-xs font-bold" role="group" aria-label={dict.nav.language}>
            {locales.map((l: Locale) => (
              <Link
                key={l}
                href={localePath(l, basePath)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                className={
                  l === locale
                    ? "rounded-full bg-flame-500 px-2 py-1.5 text-coal-950 sm:px-2.5"
                    : "rounded-full px-2 py-1.5 text-cream-400 sm:px-2.5 hover:text-cream-50"
                }
                prefetch={l === defaultLocale ? undefined : false}
              >
                {localeLabels[l]}
              </Link>
            ))}
          </div>
          <a
            href={`tel:${phone}`}
            className="grid h-11 w-11 place-items-center rounded-full bg-flame-500 text-coal-950 shadow-[var(--shadow-glow)]"
            aria-label={dict.nav.call}
          >
            <PhoneIcon />
          </a>
        </nav>
      </div>
    </header>
  );
}
