import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "@/i18n/config";

/**
 * Locale routing:
 *  - Azerbaijani (default) is served at the root: "/menu" → rewritten to "/az/menu".
 *  - "/az/..." redirects to the unprefixed canonical URL.
 *  - "/ru/..." and "/en/..." pass through.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first] = pathname.split("/");

  if (first === defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }

  if ((locales as readonly string[]).includes(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Skip API, admin, Next internals and any file with an extension (icons, sw.js, images…).
    "/((?!api|admin|_next|.*\\..*).*)",
  ],
};
