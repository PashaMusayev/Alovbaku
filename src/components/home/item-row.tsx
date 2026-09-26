"use client";

import { useAppData } from "@/components/providers/app-provider";
import { ItemCard } from "@/components/menu/item-card";

/** Horizontally scrolling row of item cards (bestsellers, combos). */
export function ItemRow({ itemIds, priority }: { itemIds: string[]; priority?: boolean }) {
  const { menu } = useAppData();
  const items = itemIds.map((id) => menu.items[id]).filter(Boolean);
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
      {items.map((item, i) => (
        <li key={item.id} className="w-[46vw] max-w-[230px] shrink-0 snap-start">
          <ItemCard item={item} compact priority={priority && i < 2} />
        </li>
      ))}
    </ul>
  );
}
