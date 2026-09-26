"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/app/admin/actions";
import type { AdminAuthMode } from "@/lib/admin/auth";
import { adminInput } from "./ui";

export function LoginForm({ mode }: { mode: AdminAuthMode }) {
  const t = useTranslations("admin.login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<"invalid" | "not_admin" | "disabled" | null>(mode === "disabled" ? "disabled" : null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await loginAction(email, password);
    if (!result.ok) setError(result.error);
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-coal-900 p-5 ring-1 ring-coal-700">
      <h1 className="font-heading text-3xl font-bold text-cream-50">{t("title")}</h1>
      {mode === "supabase" && (
        <label className="block space-y-1">
          <span className="text-sm font-semibold">{t("email")}</span>
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
        </label>
      )}
      {mode === "demo" && <p className="text-sm text-cream-500">{t("demoHint")}</p>}
      <label className="block space-y-1">
        <span className="text-sm font-semibold">{t("password")}</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={adminInput}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-ember-500">
          {t(error)}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || mode === "disabled"}
        className="h-12 w-full rounded-full bg-flame-500 font-bold text-coal-950 disabled:opacity-50"
      >
        {busy ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
