"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui-store";
import { priceSelection } from "@/lib/menu/pricing";
import { formatPrice } from "@/lib/money";
import type { PublicItem } from "@/lib/types";
import { useAppData } from "@/components/providers/app-provider";
import { CloseIcon } from "@/components/ui/icons";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FoodImage } from "./food-image";
import { ItemBadges } from "./item-badges";

/** Bottom sheet (native <dialog>: focus trap + Esc for free) for choosing variant, add-ons and quantity. */
export function ItemSheet() {
  const { menu } = useAppData();
  const openItemId = useUi((s) => s.openItemId);
  const closeItem = useUi((s) => s.closeItem);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const item = openItemId ? menu.items[openItemId] : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={dialogRef}
      onClose={closeItem}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeItem();
      }}
      aria-labelledby="item-sheet-title"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-coal-900 p-0 text-cream-100 open:animate-sheet-up sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {item && <SheetContent key={item.id} item={item} onDone={closeItem} />}
    </dialog>
  );
}

function SheetContent({ item, onDone }: { item: PublicItem; onDone: () => void }) {
  const t = useTranslations();
  const { menu, settings } = useAppData();
  const add = useCart((s) => s.add);
  const showToast = useUi((s) => s.showToast);

  const [variantId, setVariantId] = useState(item.variants[0].id);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const groups = item.addonGroupIds.map((id) => menu.addonGroups[id]).filter((g) => g && g.options.length > 0);
  const priced = useMemo(
    () => priceSelection({ itemId: item.id, variantId, addonIds, quantity }, menu.items, menu.addonGroups),
    [item.id, variantId, addonIds, quantity, menu],
  );
  const canAdd = item.inStock && settings.orderingEnabled && !("error" in priced);

  const toggleAddon = (groupId: string, optionId: string) => {
    setAddonIds((current) => {
      if (current.includes(optionId)) return current.filter((id) => id !== optionId);
      const group = menu.addonGroups[groupId];
      const inGroup = current.filter((id) => group.options.some((o) => o.id === id));
      if (group.maxSelect === 1) return [...current.filter((id) => !inGroup.includes(id)), optionId];
      if (inGroup.length >= group.maxSelect) return current;
      return [...current, optionId];
    });
  };

  const submit = () => {
    if (!canAdd) return;
    add({ itemId: item.id, variantId, addonIds, quantity });
    showToast(t("item.added", { name: item.name }));
    onDone();
  };

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="overflow-y-auto overscroll-contain">
        <div className="relative">
          <FoodImage src={item.imageUrl} alt={item.name} fallbackIcon={item.categoryIcon} sizes="(max-width: 640px) 100vw, 512px" muted={!item.inStock} />
          <ItemBadges item={item} />
          <button
            type="button"
            onClick={onDone}
            aria-label={t("item.close")}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-coal-950/80 text-cream-50 backdrop-blur"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-5 p-4">
          <header className="space-y-1">
            <h2 id="item-sheet-title" className="font-heading text-2xl font-bold text-cream-50">
              {item.name}
            </h2>
            {item.description && <p className="text-sm text-cream-300">{item.description}</p>}
          </header>

          {item.variants.length > 1 && (
            <fieldset className="space-y-2">
              <legend className="flex w-full items-center justify-between text-sm font-semibold">
                <span>{t("item.chooseOne")}</span>
                <span className="rounded-full bg-flame-500/15 px-2 py-0.5 text-xs text-flame-300">{t("item.required")}</span>
              </legend>
              <div className="flex flex-wrap gap-2 pt-1">
                {item.variants.map((v) => (
                  <label
                    key={v.id}
                    className="cursor-pointer rounded-xl px-3.5 py-2 text-sm ring-1 ring-coal-600 transition has-[:checked]:bg-flame-500 has-[:checked]:text-coal-950 has-[:checked]:ring-flame-500 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold-400"
                  >
                    <input
                      type="radio"
                      name="variant"
                      value={v.id}
                      checked={variantId === v.id}
                      onChange={() => setVariantId(v.id)}
                      className="sr-only"
                    />
                    <span className="font-semibold">{v.label ?? item.name}</span>
                    <span className="ml-1.5 opacity-80">{formatPrice(v.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {groups.map((group) => {
            const selectedInGroup = addonIds.filter((id) => group.options.some((o) => o.id === id)).length;
            return (
              <fieldset key={group.id} className="space-y-2">
                <legend className="flex w-full items-center justify-between text-sm font-semibold">
                  <span>{group.name}</span>
                  <span className="text-xs font-normal text-cream-500">
                    {group.minSelect > 0 ? t("item.required") : t("item.optional")} · {t("item.upTo", { count: group.maxSelect })}
                  </span>
                </legend>
                <ul className="divide-y divide-coal-700 rounded-xl ring-1 ring-coal-700">
                  {group.options.map((o) => {
                    const checked = addonIds.includes(o.id);
                    const disabled = !checked && group.maxSelect > 1 && selectedInGroup >= group.maxSelect;
                    return (
                      <li key={o.id}>
                        <label className={`flex min-h-12 cursor-pointer items-center gap-3 px-3 ${disabled ? "opacity-40" : ""}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleAddon(group.id, o.id)}
                            className="h-5 w-5 accent-flame-500"
                          />
                          <span className="flex-1 text-sm">{o.name}</span>
                          <span className="text-sm text-cream-300">+{formatPrice(o.price)}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>
      </div>

      <footer className="flex items-center gap-3 border-t border-coal-700 bg-coal-900 p-4 pb-safe">
        <QuantityStepper value={quantity} onChange={setQuantity} min={1} label={t("item.quantity")} />
        <button
          type="button"
          onClick={submit}
          disabled={!canAdd}
          className="h-12 flex-1 rounded-full bg-flame-500 px-4 text-base font-bold text-coal-950 shadow-glow transition active:scale-[0.98] disabled:bg-coal-600 disabled:text-cream-500 disabled:shadow-none"
        >
          {item.inStock
            ? t("item.addToCart", { price: formatPrice("error" in priced ? 0 : priced.lineTotal) })
            : t("menu.outOfStock")}
        </button>
      </footer>
    </div>
  );
}
