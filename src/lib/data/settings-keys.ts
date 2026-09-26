import type { RestaurantSettings } from "@/lib/types";

/**
 * Settings are stored as key/value rows. Keys starting with "private." are
 * not readable by anonymous clients (see RLS in 0001_init.sql).
 */
export const PUBLIC_SETTINGS_KEY = "restaurant";
export const PRIVATE_SETTINGS_KEY = "private.integrations";

type PrivateSettings = Pick<RestaurantSettings, "telegramChatId">;

export function splitSettings(s: RestaurantSettings) {
  const { telegramChatId, ...publicPart } = s;
  const privatePart: PrivateSettings = { telegramChatId };
  return [
    { key: PUBLIC_SETTINGS_KEY, value: publicPart },
    { key: PRIVATE_SETTINGS_KEY, value: privatePart },
  ];
}

export function mergeSettings(
  defaults: RestaurantSettings,
  publicPart: Partial<RestaurantSettings> | null,
  privatePart: Partial<PrivateSettings> | null,
): RestaurantSettings {
  return { ...defaults, ...(publicPart ?? {}), ...(privatePart ?? {}) };
}
