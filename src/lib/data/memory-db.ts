import "server-only";
import { buildSeedMenu, buildSeedZones } from "@/data/seed-build";
import { SEED_SETTINGS } from "@/data/seed-settings";
import type { DeliveryZone, MenuData, RestaurantSettings } from "@/lib/types";

/** Admin-only settings (not exposed to the public site). */
export interface PrivateSettings {
  telegramChatId: string | null;
  /** Warn when a price is this many times above/below its category's median. */
  priceOutlierFactor: number;
}

export const DEFAULT_PRIVATE_SETTINGS: PrivateSettings = { telegramChatId: null, priceOutlierFactor: 1.9 };

interface MemoryDb {
  menu: MenuData;
  settings: RestaurantSettings;
  zones: DeliveryZone[];
  privateSettings: PrivateSettings;
}

const g = globalThis as unknown as { __alovDb?: MemoryDb };

/**
 * Mutable in-memory database used when Supabase is not configured (local development
 * and demos). Starts from the seed; admin edits change it until the server restarts.
 */
export function memoryDb(): MemoryDb {
  g.__alovDb ??= {
    menu: buildSeedMenu(),
    settings: structuredClone(SEED_SETTINGS),
    zones: buildSeedZones(),
    privateSettings: { ...DEFAULT_PRIVATE_SETTINGS },
  };
  return g.__alovDb;
}
