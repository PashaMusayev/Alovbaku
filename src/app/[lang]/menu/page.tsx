import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getPublicMenu } from "@/lib/data/menu";
import { alternatesFor } from "@/lib/seo";
import { MenuBrowser } from "@/components/menu/MenuBrowser";
import { MenuProvider } from "@/components/menu/MenuProvider";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/menu">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: { absolute: dict.meta.menuTitle },
    description: dict.meta.menuDescription,
    alternates: alternatesFor(lang, "/menu"),
  };
}

export default async function MenuPage({ params }: PageProps<"/[lang]/menu">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const menu = await getPublicMenu();

  return (
    <MenuProvider groups={menu.optionGroups}>
      <h1 className="sr-only">{dict.menu.title}</h1>
      <MenuBrowser categories={menu.categories} items={menu.items} />
    </MenuProvider>
  );
}
