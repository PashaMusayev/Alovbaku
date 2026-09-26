import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site-url";
import { buildPublicMenu, buildPublicSettings } from "@/lib/menu/public-menu";
import { getDeliveryZones, getMenuData, getSettings } from "@/lib/menu/repository";
import { AppProvider } from "@/components/providers/app-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartBar } from "@/components/cart/cart-bar";
import { ItemSheet } from "@/components/menu/item-sheet";
import { inter, oswald } from "../fonts";
import "../globals.css";

/** Menu and settings are cached and refreshed every minute (and on admin edits). */
export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : "az", namespace: "meta" });
  return {
    metadataBase: getSiteUrl(),
    title: { default: t("title"), template: "%s · Alov Baku" },
    description: t("description"),
    applicationName: "Alov Baku",
    alternates: {
      canonical: locale === routing.defaultLocale ? "/" : `/${locale}`,
      languages: { az: "/", ru: "/ru", en: "/en", "x-default": "/" },
    },
    openGraph: {
      type: "website",
      siteName: "Alov Baku",
      title: t("title"),
      description: t("description"),
      locale: { az: "az_AZ", ru: "ru_RU", en: "en_US" }[locale] ?? "az_AZ",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [menuData, settings, zones, t] = await Promise.all([
    getMenuData(),
    getSettings(),
    getDeliveryZones(),
    getTranslations({ locale, namespace: "nav" }),
  ]);
  const menu = buildPublicMenu(menuData, locale);
  const publicSettings = buildPublicSettings(settings, zones, locale);

  return (
    <html lang={locale} className={`${oswald.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-cream-100 focus:px-3 focus:py-2 focus:text-coal-950"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <AppProvider menu={menu} settings={publicSettings}>
            <Header phone={publicSettings.phone} />
            <main id="main">{children}</main>
            <Footer settings={publicSettings} />
            <CartBar />
            <ItemSheet />
          </AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
