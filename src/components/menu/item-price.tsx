import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/money";
import type { PublicItem } from "@/lib/types";

/** Price, with "from" for items whose variants have different prices. */
export function ItemPrice({ item }: { item: PublicItem }) {
  const t = useTranslations("menu");
  const prices = item.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const price = formatPrice(min);
  return (
    <span className="text-base font-bold leading-tight text-cream-50">
      {prices.some((p) => p !== min) ? t("from", { price }) : price}
    </span>
  );
}
