"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useI18n } from "@/i18n/client";
import { formatPrice } from "@/lib/money";
import { computeUnitPrice } from "@/lib/pricing";
import { useCart } from "@/lib/cart-store";
import type { MenuItem, OptionGroup } from "@/lib/types";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { FoodImage } from "./FoodImage";
import { Badges } from "./Badges";

interface Props {
  item: MenuItem | null;
  groups: OptionGroup[];
  onClose: () => void;
  onAdded?: (item: MenuItem) => void;
}

/**
 * Bottom sheet (mobile) / centered dialog (desktop) for choosing a variant,
 * add-ons and quantity. Built on native <dialog> for focus management + Esc.
 */
export function ItemSheet({ item, groups, onClose, onAdded }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-coal-800 p-0 text-cream-100 backdrop:bg-coal-950/80 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {item && <SheetBody key={item.id} item={item} groups={groups} onClose={onClose} onAdded={onAdded} />}
    </dialog>
  );
}

function SheetBody({
  item,
  groups,
  onClose,
  onAdded,
}: {
  item: MenuItem;
  groups: OptionGroup[];
  onClose: () => void;
  onAdded?: (item: MenuItem) => void;
}) {
  const { dict, f, l } = useI18n();
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState(item.variants[0]?.id ?? "");
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const itemGroups = item.optionGroupIds
    .map((id) => groups.find((g) => g.id === id))
    .filter((g): g is OptionGroup => !!g);
  const variant = item.variants.find((v) => v.id === variantId);
  const result = computeUnitPrice(item, variantId, optionIds, groups);
  const unitPrice = result.ok ? result.unitPrice : (variant?.priceSite ?? 0);
  const name = l(item.name);

  function toggleOption(group: OptionGroup, optionId: string) {
    setOptionIds((prev) => {
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      const inGroup = prev.filter((id) => group.options.some((o) => o.id === id));
      if (group.maxSelect === 1) return [...prev.filter((id) => !inGroup.includes(id)), optionId];
      if (inGroup.length >= group.maxSelect) return prev;
      return [...prev, optionId];
    });
  }

  function handleAdd() {
    if (!result.ok || !variant) return;
    add(
      {
        itemId: item.id,
        variantId,
        optionIds,
        name: item.name,
        variantLabel: item.variants.length > 1 ? variant.label : null,
        optionNames: itemGroups.flatMap((g) => g.options.filter((o) => optionIds.includes(o.id)).map((o) => o.name)),
        unitPrice: result.unitPrice,
        art: item.art,
        imageUrl: item.imageUrl,
      },
      quantity,
    );
    onAdded?.(item);
    onClose();
  }

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="relative shrink-0">
        <FoodImage src={item.imageUrl} art={item.art} alt={name} sizes="(min-width: 640px) 512px, 100vw" className="max-h-[34dvh]" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-coal-950/80 text-cream-50"
          aria-label={dict.item.close}
        >
          <CloseIcon />
        </button>
        <Badges item={item} className="absolute bottom-3 left-3" />
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase text-cream-50">{name}</h2>
          {item.description && <p className="mt-1 text-cream-400">{l(item.description)}</p>}
        </div>

        {item.isCombo && item.comboComponents.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-cream-400">{dict.item.comboIncludes}</h3>
            <ul className="space-y-1 text-cream-200">
              {item.comboComponents.map((c) => (
                <li key={c.id}>
                  {c.quantity > 1 ? `${c.quantity} × ` : ""}
                  {l(c.label)}
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.variants.length > 1 && (
          <fieldset>
            <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold uppercase tracking-wide text-cream-400">
              <span>{l(item.variantLabel) || dict.item.required}</span>
              <span className="rounded-full bg-coal-700 px-2 py-0.5 text-[0.7rem] normal-case text-cream-200">{dict.item.required}</span>
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {item.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={v.id === variantId}
                  onClick={() => setVariantId(v.id)}
                  className="chip min-h-12 flex-col items-start gap-0 px-4 py-2 leading-tight"
                >
                  <span className="font-semibold">{l(v.label)}</span>
                  <span className="text-xs opacity-80">{formatPrice(v.priceSite)}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {itemGroups.map((g) => {
          const count = optionIds.filter((id) => g.options.some((o) => o.id === id)).length;
          return (
            <fieldset key={g.id}>
              <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold uppercase tracking-wide text-cream-400">
                <span>{l(g.name)}</span>
                <span className="rounded-full bg-coal-700 px-2 py-0.5 text-[0.7rem] normal-case text-cream-200">
                  {g.minSelect > 0 ? dict.item.required : dict.item.optional}
                  {g.maxSelect > 1 ? ` · ${f(dict.item.chooseUpTo, { count: g.maxSelect })}` : ""}
                </span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {g.options
                  .filter((o) => o.isAvailable)
                  .map((o) => {
                    const checked = optionIds.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        disabled={!checked && count >= g.maxSelect && g.maxSelect > 1}
                        onClick={() => toggleOption(g, o.id)}
                        className="chip disabled:opacity-40"
                      >
                        {l(o.name)}
                        {o.priceDelta > 0 && <span className="text-xs opacity-80">+{formatPrice(o.priceDelta)}</span>}
                      </button>
                    );
                  })}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-3 border-t border-coal-600 bg-coal-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center rounded-full border border-coal-500" role="group" aria-label={dict.item.quantity}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="grid h-12 w-12 place-items-center"
            aria-label={dict.item.decrease}
          >
            <MinusIcon />
          </button>
          <span className="w-6 text-center font-bold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            className="grid h-12 w-12 place-items-center"
            aria-label={dict.item.increase}
          >
            <PlusIcon />
          </button>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!result.ok}
          className={clsx("btn-primary flex-1")}
        >
          {result.ok || result.error !== "item_unavailable"
            ? f(dict.item.addToCart, { price: formatPrice(unitPrice * quantity) })
            : dict.item.unavailable}
        </button>
      </div>
    </div>
  );
}
