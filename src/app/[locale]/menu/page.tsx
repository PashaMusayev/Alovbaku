import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/types";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { OpenStatus } from "@/components/home/open-status";

export async function generateMetadata({ params }: PageProps<"/[locale]/menu">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("menuTitle"),
    description: t("menuDescription"),
    alternates: {
      canonical: locale === "az" ? "/menu" : `/${locale}/menu`,
      languages: { az: "/menu", ru: "/ru/menu", en: "/en/menu" },
    },
  };
}

export default async function MenuPage({ params }: PageProps<"/[locale]/menu">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("menu");
  return (
    <>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 pt-5">
        <h1 className="font-heading text-4xl font-bold text-cream-50">{t("title")}</h1>
        <OpenStatus withHours={false} />
      </div>
      <MenuBrowser />
    </>
  );
}
