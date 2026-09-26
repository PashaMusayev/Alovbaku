import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { inter, oswald } from "../fonts";
import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "az", namespace: "admin" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export const viewport: Viewport = { themeColor: "#0c0a09", width: "device-width", initialScale: 1 };

/** Separate root layout: the admin panel is Azerbaijani-only and has no public header/cart. */
export default async function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  const messages = await getMessages({ locale: "az" });
  return (
    <html lang="az" className={`${oswald.variable} ${inter.variable}`}>
      <body className="min-h-dvh bg-coal-950 antialiased">
        <NextIntlClientProvider locale="az" messages={{ admin: messages.admin, staff: messages.staff }}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
