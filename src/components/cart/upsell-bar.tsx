"use client";

import { useTranslations } from "next-intl";
import { useAddToCart } from "@/lib/cart/use-add-to-cart";
import { useUi } from "@/lib/cart/ui-store";
import { formatPrice } from "@/lib/money";
import { useAppData } from "@/components/providers/app-provider";
import { CloseIcon } from "@/components/ui/icons";

/** "Ayran əlavə edək? +1,10 ₼" — one tap to add the suggested extra. */
export function UpsellBar() {
  const t = useTranslations("upsell");
  const { menu } = useAppData();
  const upsellItemId = useUi((s) => s.upsellItemId);
  const showUpsell = useUi((s) => s.showUpsell);
  const addToCart = useAddToCart();
  const item = upsellItemId ? menu.items[upsellItemId] : undefined;
  if (!item) return null;
  const variant = item.variants[0];

  return (
    <div className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-2xl bg-coal-800 p-2 pl-4 shadow-xl ring-1 ring-coal-600">
      <span aria-hidden className="text-2xl">
        {item.categoryIcon}
      </span>
      <p className="flex-1 text-sm font-semibold text-cream-50">{t("question", { name: item.name })}</p>
      <button
        type="button"
        onClick={() => addToCart({ itemId: item.id, variantId: variant.id, addonIds: [], quantity: 1 }, { upsell: false })}
        className="h-10 shrink-0 rounded-full bg-cream-100 px-3 text-sm font-bold text-coal-950"
      >
        {t("add", { price: formatPrice(variant.price) })}
      </button>
      <button
        type="button"
        onClick={() => showUpsell(null)}
        aria-label={t("dismiss")}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-cream-300"
      >
        <CloseIcon width={18} height={18} />
      </button>
    </div>
  );
}
