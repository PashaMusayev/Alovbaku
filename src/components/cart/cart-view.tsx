"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { findBestCombo } from "@/lib/cart/combos";
import { useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui-store";
import { computeCart } from "@/lib/cart/totals";
import { formatPrice } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { useOpenState } from "@/lib/use-open-state";
import { useAppData } from "@/components/providers/app-provider";
import { FoodImage } from "@/components/menu/food-image";
import { ArrowRightIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

export function CartView() {
  const t = useTranslations();
  const { menu, settings } = useAppData();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const swap = useCart((s) => s.swap);
  const showToast = useUi((s) => s.showToast);
  const openState = useOpenState(settings.openingHours, settings.timezone);
  const { views, subtotal } = computeCart(lines, menu);
  const combo = findBestCombo(lines, menu);
  const comboItem = combo ? menu.items[combo.comboItemId] : undefined;

  const applyCombo = () => {
    if (!combo || !comboItem) return;
    swap(combo.consume, { itemId: comboItem.id, variantId: comboItem.variants[0].id, addonIds: [], quantity: 1 });
    showToast(t("combo.applied", { name: comboItem.name }));
  };

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

      {combo && comboItem && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-ember-700 to-flame-600 p-3 pl-4 text-cream-50">
          <span aria-hidden className="text-2xl">
            🎁
          </span>
          <p className="flex-1">
            <span className="block font-bold">{t("combo.suggest", { amount: formatPrice(combo.savings) })}</span>
            <span className="block text-sm text-cream-100/90">{comboItem.name}</span>
          </p>
          <button type="button" onClick={applyCombo} className="h-10 shrink-0 rounded-full bg-cream-50 px-4 font-bold text-coal-950">
            {t("combo.apply")}
          </button>
        </div>
      )}

      <dl className="flex items-center justify-between rounded-2xl bg-coal-900 p-4 ring-1 ring-coal-700">
        <dt className="text-cream-300">{t("cart.subtotal")}</dt>
        <dd className="text-xl font-extrabold tabular-nums text-cream-50">{formatPrice(subtotal)}</dd>
      </dl>

      {openState && !openState.isOpen && openState.nextOpening && (
        <p role="status" className="rounded-2xl bg-coal-800 p-3 text-sm text-cream-100 ring-1 ring-ember-600/60">
          {t("cart.closedNotice", { time: openState.nextOpening.time })}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Link
          href="/checkout"
          className="flex h-14 items-center justify-center gap-2 rounded-full bg-flame-500 text-lg font-bold text-coal-950 shadow-glow"
        >
          {t("cart.checkout")} <ArrowRightIcon />
        </Link>
        <Link href="/menu" className="flex h-12 items-center justify-center rounded-full bg-coal-800 font-semibold ring-1 ring-coal-600">
          {t("cart.backToMenu")}
        </Link>
      </div>
    </div>
  );
}
