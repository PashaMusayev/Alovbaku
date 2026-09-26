import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const MENU_CACHE_TAG = "menu";
export const SETTINGS_CACHE_TAG = "settings";

let client: SupabaseClient | null = null;

/**
 * Anonymous, cache-friendly client for public reads (menu, settings).
 * Responses are cached by Next.js and invalidated by tag when the admin edits.
 */
export function publicSupabase(): SupabaseClient {
  if (client) return client;
  client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: { revalidate: 300, tags: [MENU_CACHE_TAG, SETTINGS_CACHE_TAG] },
        }),
    },
  });
  return client;
}
