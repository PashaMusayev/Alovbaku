import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { toPublicOrderView } from "@/lib/orders/public-view";
import { getOrderByToken } from "@/lib/orders/store";
import type { Locale } from "@/lib/types";
import { OrderTracker } from "@/components/order/order-tracker";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/order/[token]">): Promise<Metadata> {
  const { locale } = (await params) as { locale: Locale };
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("orderTitle"), robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: PageProps<"/[locale]/order/[token]">) {
  const { locale, token } = (await params) as { locale: Locale; token: string };
  setRequestLocale(locale);
  const order = await getOrderByToken(token);
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <OrderTracker initial={toPublicOrderView(order)} />
    </div>
  );
}
