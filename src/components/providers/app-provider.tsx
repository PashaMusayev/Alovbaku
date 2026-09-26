"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useCart } from "@/lib/cart/store";
import type { PublicMenu, PublicSettings } from "@/lib/types";

interface AppData {
  menu: PublicMenu;
  settings: PublicSettings;
}

const AppContext = createContext<AppData | null>(null);

export function AppProvider({ menu, settings, children }: AppData & { children: ReactNode }) {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return <AppContext.Provider value={{ menu, settings }}>{children}</AppContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppData must be used inside <AppProvider>");
  return ctx;
}
