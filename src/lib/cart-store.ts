"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { lineKey } from "./pricing";
import type { FoodArt, LocalizedText, Qepik } from "./types";

export interface CartLine {
  key: string;
  itemId: string;
  variantId: string;
  optionIds: string[];
  quantity: number;
  /* Display snapshot only — the server recomputes prices on submission. */
  name: LocalizedText;
  variantLabel: LocalizedText | null;
  optionNames: LocalizedText[];
  unitPrice: Qepik;
  art: FoodArt;
  imageUrl: string | null;
}

export type NewCartLine = Omit<CartLine, "key" | "quantity">;

interface CartState {
  lines: CartLine[];
  add: (line: NewCartLine, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const MAX_LINE_QUANTITY = 50;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const key = lineKey(line.itemId, line.variantId, line.optionIds);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key
                  ? { ...l, ...line, key, quantity: Math.min(MAX_LINE_QUANTITY, l.quantity + quantity) }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key, quantity }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) =>
                  l.key === key ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : l,
                ),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "alov-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated on mount by <CartHydrator> to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): Qepik {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}
