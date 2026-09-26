"use client";

import type { CartLine } from "@/lib/cart/store";

/** Customer details and the last order are remembered on this device (no account needed). */
const DETAILS_KEY = "alov-customer-v1";
const LAST_ORDER_KEY = "alov-last-order-v1";

export interface SavedDetails {
  name: string;
  /** National digits, e.g. "552437999". */
  phone: string;
  address: string;
  addressNotes: string;
  lat: number | null;
  lng: number | null;
}

export interface SavedOrder {
  number: number;
  token: string;
  createdAt: string;
  lines: Omit<CartLine, "key">[];
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — not critical */
  }
}

export const loadDetails = () => read<SavedDetails>(DETAILS_KEY);
export const saveDetails = (d: SavedDetails) => write(DETAILS_KEY, d);
export const loadLastOrder = () => read<SavedOrder>(LAST_ORDER_KEY);
export const saveLastOrder = (o: SavedOrder) => write(LAST_ORDER_KEY, o);

export const whatsappTextKey = (token: string) => `alov-wa-${token}`;
export function saveWhatsappText(token: string, text: string, notified: boolean) {
  try {
    sessionStorage.setItem(whatsappTextKey(token), JSON.stringify({ text, notified }));
  } catch {
    /* ignore */
  }
}
export function loadWhatsappText(token: string): { text: string; notified: boolean } | null {
  try {
    const raw = sessionStorage.getItem(whatsappTextKey(token));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
