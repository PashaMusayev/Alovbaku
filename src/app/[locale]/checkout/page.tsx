import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/types";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export async function generateMetadata({ params }: PageProps<"/[locale]/checkout">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("checkoutTitle"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: PageProps<"/[locale]/checkout">) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 font-heading text-4xl font-bold text-cream-50">{t("title")}</h1>
      <CheckoutForm />
    </div>
  );
}
