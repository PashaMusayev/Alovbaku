"use client";

import type { MenuItem } from "@/lib/types";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { useMenuActions } from "@/components/menu/MenuProvider";

/** Horizontal, snap-scrolling row of large item cards (thumb-friendly on phones). */
export function ItemRail({ items, priorityFirst = false }: { items: MenuItem[]; priorityFirst?: boolean }) {
  const { openItem } = useMenuActions();
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
      {items.map((item, i) => (
        <div key={item.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
          <MenuItemCard item={item} onSelect={openItem} priority={priorityFirst && i === 0} />
        </div>
      ))}
    </div>
  );
}
