"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/lib/cart/store";
import { useUi } from "@/lib/cart/ui-store";
import type { PublicItem } from "@/lib/types";
import { useAppData } from "@/components/providers/app-provider";
import { PlusIcon } from "@/components/ui/icons";
import { FoodImage } from "./food-image";
import { ItemBadges } from "./item-badges";
import { ItemPrice } from "./item-price";

/** Items with one variant and no add-ons go straight to the cart; others open the item sheet. */
export function needsOptions(item: PublicItem): boolean {
  return item.variants.length > 1 || item.addonGroupIds.length > 0;
}

export function ItemCard({ item, priority, compact }: { item: PublicItem; priority?: boolean; compact?: boolean }) {
  const t = useTranslations();
  const { settings } = useAppData();
  const openItem = useUi((s) => s.openItem);
  const showToast = useUi((s) => s.showToast);
  const add = useCart((s) => s.add);
  const canOrder = item.inStock && settings.orderingEnabled;

  const quickAdd = () => {
    if (needsOptions(item)) return openItem(item.id);
    add({ itemId: item.id, variantId: item.variants[0].id, addonIds: [], quantity: 1 });
    showToast(t("item.added", { name: item.name }));
  };

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-coal-900 ring-1 ring-coal-700/70 transition hover:ring-flame-500/60">
      <button
        type="button"
        onClick={() => openItem(item.id)}
        className="flex flex-1 flex-col text-left"
        aria-haspopup="dialog"
      >
        <div className="relative">
          <FoodImage
            src={item.imageUrl}
            alt={item.name}
            fallbackIcon={item.categoryIcon}
            sizes={compact ? "(max-width: 640px) 45vw, 220px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            priority={priority}
            muted={!item.inStock}
          />
          <ItemBadges item={item} />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3 pb-14">
          <h3 className="text-[0.95rem] font-semibold leading-snug text-cream-50">{item.name}</h3>
          {item.description && <p className="line-clamp-2 text-xs leading-snug text-cream-300">{item.description}</p>}
        </div>
      </button>
      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <ItemPrice item={item} />
        <button
          type="button"
          onClick={quickAdd}
          disabled={!canOrder}
          aria-label={t("menu.addNamed", { name: item.name })}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-flame-500 text-coal-950 shadow-glow transition active:scale-95 disabled:bg-coal-600 disabled:text-cream-500 disabled:shadow-none"
        >
          <PlusIcon width={22} height={22} strokeWidth={2.6} />
        </button>
      </div>
    </article>
  );
}
