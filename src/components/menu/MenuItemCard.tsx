"use client";

import clsx from "clsx";
import { useI18n } from "@/i18n/client";
import { formatPrice } from "@/lib/money";
import { minSitePrice, woltStrikePrice } from "@/lib/data/public-menu";
import type { MenuItem } from "@/lib/types";
import { PlusIcon } from "@/components/ui/icons";
import { FoodImage } from "./FoodImage";
import { Badges } from "./Badges";

export function MenuItemCard({
  item,
  onSelect,
  priority = false,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  priority?: boolean;
}) {
  const { dict, f, l } = useI18n();
  const name = l(item.name);
  const hasChoices = item.variants.length > 1;
  const price = minSitePrice(item);
  const wolt = woltStrikePrice(item);
  const soldOut = !item.inStock;

  return (
    <article className={clsx("card group relative flex flex-col overflow-hidden", soldOut && "opacity-60")}>
      <button
        type="button"
        onClick={() => onSelect(item)}
        disabled={soldOut}
        className="flex flex-1 flex-col text-left"
      >
        <div className="relative">
          <FoodImage src={item.imageUrl} art={item.art} alt={name} priority={priority} />
          <Badges item={item} className="absolute left-2.5 top-2.5" />
          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 bg-coal-950/85 py-1.5 text-center text-sm font-bold uppercase text-cream-100">
              {dict.menu.outOfStock}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3.5">
          <h3 className="font-display text-lg font-semibold uppercase leading-tight text-cream-50">{name}</h3>
          {item.description && <p className="line-clamp-2 text-sm text-cream-400">{l(item.description)}</p>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-flame-400">
                {hasChoices ? f(dict.menu.from, { price: formatPrice(price) }) : formatPrice(price)}
              </span>
              {wolt !== null && (
                <span className="text-xs text-cream-500">
                  <s>{f(dict.wolt.strikeLabel, { price: formatPrice(wolt) })}</s>
                </span>
              )}
            </div>
            {!soldOut && (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-flame-500 text-coal-950 transition group-hover:scale-105" aria-hidden="true">
                <PlusIcon />
              </span>
            )}
          </div>
        </div>
      </button>
    </article>
  );
}
