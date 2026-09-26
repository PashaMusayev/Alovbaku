"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart/store";
import { computeCart } from "@/lib/cart/totals";
import { formatPrice } from "@/lib/money";
import { telHref } from "@/lib/phone";
import { useHydrated } from "@/lib/use-hydrated";
import { useAppData } from "@/components/providers/app-provider";
import { FoodImage } from "@/components/menu/food-image";
import { PhoneIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

export function CartView() {
  const t = useTranslations();
  const { menu, settings } = useAppData();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const { views, subtotal } = computeCart(lines, menu);

  if (!hydrated) return <div className="h-64" aria-busy="true" />;

  if (views.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl" aria-hidden>
          🛒
        </p>
        <p className="mt-4 font-heading text-2xl text-cream-50">{t("cart.empty")}</p>
        <p className="mt-1 text-cream-300">{t("cart.emptyHint")}</p>
        <Link href="/menu" className="mt-6 inline-flex h-12 items-center rounded-full bg-flame-500 px-6 font-bold text-coal-950">
          {t("cart.backToMenu")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-coal-700 rounded-2xl bg-coal-900 ring-1 ring-coal-700">
        {views.map(({ line, lineTotal, valid }) => {
          const item = menu.items[line.itemId];
          const variant = item?.variants.find((v) => v.id === line.variantId);
          const addonNames = line.addonIds
            .map((id) => Object.values(menu.addonGroups).flatMap((g) => g.options).find((o) => o.id === id)?.name)
            .filter(Boolean);
          const name = item?.name ?? t("cart.unavailable");
          return (
            <li key={line.key} className="flex gap-3 p-3">
              <div className="w-20 shrink-0 overflow-hidden rounded-xl">
                <FoodImage src={item?.imageUrl ?? null} alt={name} fallbackIcon={item?.categoryIcon ?? "🍽️"} sizes="80px" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-cream-50">{name}</p>
                {variant?.label && item && item.variants.length > 1 && <p className="text-xs text-cream-300">{variant.label}</p>}
                {addonNames.length > 0 && <p className="text-xs text-cream-500">+ {addonNames.join(", ")}</p>}
                {!valid && <p className="text-xs font-semibold text-ember-500">{t("cart.unavailable")}</p>}
                <div className="mt-2 flex items-center justify-between gap-2">
                  {valid ? (
                    <QuantityStepper
                      size="sm"
                      min={0}
                      value={line.quantity}
                      onChange={(q) => setQuantity(line.key, q)}
                      label={t("item.quantity")}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => remove(line.key)}
                      className="h-9 rounded-full bg-coal-800 px-3 text-sm"
                      aria-label={t("cart.removeNamed", { name })}
                    >
                      {t("cart.remove")}
                    </button>
                  )}
                  <span className="font-bold tabular-nums">{formatPrice(lineTotal)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="flex items-center justify-between rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
        <dt className="text-cream-300">{t("cart.subtotal")}</dt>
        <dd className="text-xl font-extrabold tabular-nums text-cream-50">{formatPrice(subtotal)}</dd>
      </dl>

      <div className="flex flex-col gap-3">
        {/* Online checkout arrives in phase 2; until then the order goes by phone. */}
        <a
          href={telHref(settings.phone)}
          className="flex h-14 items-center justify-center gap-2 rounded-full bg-flame-500 text-lg font-bold text-coal-950 shadow-glow"
        >
          <PhoneIcon /> {t("cart.orderByPhone")}
        </a>
        <Link href="/menu" className="flex h-12 items-center justify-center rounded-full bg-coal-800 font-semibold ring-1 ring-coal-600">
          {t("cart.backToMenu")}
        </Link>
      </div>
    </div>
  );
}
