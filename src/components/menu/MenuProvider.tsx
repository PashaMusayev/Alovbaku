"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import type { MenuItem, OptionGroup } from "@/lib/types";
import { ItemSheet } from "./ItemSheet";

interface MenuActions {
  openItem: (item: MenuItem) => void;
}

const MenuContext = createContext<MenuActions | null>(null);

/** Hosts the item sheet + "added to cart" toast for any menu surface. */
export function MenuProvider({ groups, children }: { groups: OptionGroup[]; children: ReactNode }) {
  const { dict, l } = useI18n();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const openItem = useCallback((item: MenuItem) => setSelected(item), []);
  const onAdded = useCallback(
    (item: MenuItem) => {
      setToast(`${dict.cart.added}: ${l(item.name)}`);
      window.setTimeout(() => setToast(null), 2200);
    },
    [dict.cart.added, l],
  );

  return (
    <MenuContext.Provider value={{ openItem }}>
      {children}
      <ItemSheet item={selected} groups={groups} onClose={() => setSelected(null)} onAdded={onAdded} />
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
        {toast && (
          <div className="rounded-full bg-cream-50 px-5 py-2.5 text-sm font-semibold text-coal-950 shadow-lg">✓ {toast}</div>
        )}
      </div>
    </MenuContext.Provider>
  );
}

export function useMenuActions(): MenuActions {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuActions must be used inside <MenuProvider>");
  return ctx;
}
