import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { isLocale, locales, localeTags } from "@/i18n/config";
import { alternatesFor } from "@/lib/seo";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/data/menu";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartBar } from "@/components/layout/CartBar";

const oswald = Oswald({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#0d0b0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: dict.meta.title, template: `%s | ${dict.brand.name}` },
    description: dict.meta.description,
    keywords: dict.meta.keywords,
    applicationName: dict.brand.name,
    alternates: alternatesFor(lang, "/"),
    openGraph: {
      type: "website",
      siteName: dict.brand.name,
      locale: localeTags[lang].replace("-", "_"),
      title: dict.meta.title,
      description: dict.meta.description,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const settings = await getSettings();

  return (
    <html lang={lang} className={`${oswald.variable} ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <I18nProvider locale={lang} dict={dict}>
          <Header phone={settings.phone} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer dict={dict} locale={lang} settings={settings} />
          <CartBar />
        </I18nProvider>
      </body>
    </html>
  );
}
