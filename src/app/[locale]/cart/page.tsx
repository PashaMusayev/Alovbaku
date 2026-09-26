import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/types";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata({ params }: PageProps<"/[locale]/cart">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("cartTitle"), robots: { index: false } };
}

export default async function CartPage({ params }: PageProps<"/[locale]/cart">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 font-heading text-4xl font-bold text-cream-50">{t("title")}</h1>
      <CartView />
    </div>
  );
}
