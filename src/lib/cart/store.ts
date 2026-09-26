"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface CartLine {
  /** itemId|variantId|sorted addonIds — identical selections merge into one line. */
  key: string;
  itemId: string;
  variantId: string;
  addonIds: string[];
  quantity: number;
}

export const MAX_LINE_QUANTITY = 50;

export function lineKey(itemId: string, variantId: string, addonIds: string[]): string {
  return [itemId, variantId, [...addonIds].sort().join(",")].join("|");
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const clampQty = (q: number) => Math.min(MAX_LINE_QUANTITY, Math.max(0, Math.floor(q)));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: ({ itemId, variantId, addonIds, quantity }) =>
        set((state) => {
          const key = lineKey(itemId, variantId, addonIds);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: clampQty(l.quantity + quantity) } : l)),
            };
          }
          const sorted = [...addonIds].sort();
          return { lines: [...state.lines, { key, itemId, variantId, addonIds: sorted, quantity: clampQty(quantity) }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.key === key ? { ...l, quantity: clampQty(quantity) } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "alov-cart-v1",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually after mount to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
);
