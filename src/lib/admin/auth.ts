import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getServiceClient } from "@/lib/supabase/admin";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Admin access.
 *  - Production: Supabase Auth (email + password). A user is an admin when listed in
 *    `admin_users`; emails in ADMIN_EMAILS are added there automatically on first login.
 *  - Local demo (no Supabase, not on Vercel): a single password from ADMIN_DEMO_PASSWORD.
 */

export type AdminAuthMode = "supabase" | "demo" | "disabled";
export interface AdminSession {
  email: string;
  mode: Exclude<AdminAuthMode, "disabled">;
}

const DEMO_COOKIE = "alov_admin_demo";

export function adminAuthMode(): AdminAuthMode {
  if (isSupabaseConfigured()) return "supabase";
  if (!process.env.VERCEL && process.env.ADMIN_DEMO_PASSWORD) return "demo";
  return "disabled";
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

function demoToken(): string {
  return createHmac("sha256", process.env.ADMIN_DEMO_PASSWORD ?? "").update("alov-admin-demo").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Returns true when the user is (or has just been made) an admin. */
async function ensureAdmin(user: { id: string; email?: string; email_confirmed_at?: string | null }): Promise<boolean> {
  const db = getServiceClient();
  const { data } = await db.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (data) return true;
  const email = user.email?.toLowerCase();
  if (email && user.email_confirmed_at && adminEmails().includes(email)) {
    const { error } = await db.from("admin_users").insert({ user_id: user.id, display_name: email });
    return !error;
  }
  return false;
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const mode = adminAuthMode();
  if (mode === "demo") {
    const token = (await cookies()).get(DEMO_COOKIE)?.value;
    return token && safeEqual(token, demoToken()) ? { email: "demo@alov.local", mode } : null;
  }
  if (mode === "supabase") {
    const supabase = await createAuthClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return (await ensureAdmin(data.user)) ? { email: data.user.email ?? "", mode } : null;
  }
  return null;
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export type LoginResult = { ok: true } | { ok: false; error: "invalid" | "not_admin" | "disabled" };

export async function loginAdmin(email: string, password: string): Promise<LoginResult> {
  const mode = adminAuthMode();
  if (mode === "demo") {
    if (!safeEqual(password, process.env.ADMIN_DEMO_PASSWORD ?? "")) return { ok: false, error: "invalid" };
    (await cookies()).set(DEMO_COOKIE, demoToken(), { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" && !!process.env.VERCEL, maxAge: 60 * 60 * 24 * 30 });
    return { ok: true };
  }
  if (mode === "supabase") {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return { ok: false, error: "invalid" };
    if (!(await ensureAdmin(data.user))) {
      await supabase.auth.signOut();
      return { ok: false, error: "not_admin" };
    }
    return { ok: true };
  }
  return { ok: false, error: "disabled" };
}

export async function logoutAdmin(): Promise<void> {
  if (adminAuthMode() === "supabase") await (await createAuthClient()).auth.signOut();
  (await cookies()).delete(DEMO_COOKIE);
}
