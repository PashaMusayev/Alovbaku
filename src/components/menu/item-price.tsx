import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/money";
import type { PublicItem } from "@/lib/types";

/** Site price (with "from" for multi-price items) and the struck-through Wolt price when it is higher. */
export function ItemPrice({ item }: { item: PublicItem }) {
  const t = useTranslations("menu");
  const cheapest = item.variants.reduce((min, v) => (v.price < min.price ? v : min), item.variants[0]);
  const hasRange = item.variants.some((v) => v.price !== cheapest.price);
  const price = formatPrice(cheapest.price);
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-base font-bold text-cream-50">{hasRange ? t("from", { price }) : price}</span>
      {cheapest.woltPrice !== null && (
        <span className="text-xs text-cream-500">
          <span className="sr-only">{t("woltPriceLabel")}: </span>
          <s>{t("woltPrice", { price: formatPrice(cheapest.woltPrice) })}</s>
        </span>
      )}
    </div>
  );
}
