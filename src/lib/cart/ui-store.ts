"use client";

import { create } from "zustand";

interface UiState {
  /** Item currently open in the item sheet. */
  openItemId: string | null;
  openItem: (id: string) => void;
  closeItem: () => void;
  /** Short confirmation announced to screen readers and shown as a toast. */
  toast: string | null;
  showToast: (message: string) => void;
  /** Suggested extra after adding a main dish ("Ayran əlavə edək?"). */
  upsellItemId: string | null;
  showUpsell: (id: string | null) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiState>()((set) => ({
  openItemId: null,
  openItem: (id) => set({ openItemId: id }),
  closeItem: () => set({ openItemId: null }),
  toast: null,
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },
  upsellItemId: null,
  showUpsell: (id) => set({ upsellItemId: id }),
}));
