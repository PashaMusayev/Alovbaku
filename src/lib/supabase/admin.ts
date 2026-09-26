import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

let client: SupabaseClient | null = null;

export function isServiceRoleConfigured(): boolean {
  return supabaseUrl !== "" && (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "") !== "";
}

/** Service-role client: bypasses RLS. Server-only; never import from client components. */
export function getServiceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  client ??= createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
