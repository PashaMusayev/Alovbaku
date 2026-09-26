"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { logoutAction } from "@/app/admin/actions";
import { Logo } from "@/components/layout/logo";

const LINKS = [
  { href: "/admin", key: "orders", icon: "🧾" },
  { href: "/admin/menu", key: "menu", icon: "🍽️" },
  { href: "/admin/analytics", key: "analytics", icon: "📊" },
  { href: "/admin/customers", key: "customers", icon: "👥" },
  { href: "/admin/settings", key: "settings", icon: "⚙️" },
] as const;

/** Bottom tab bar on phones, sidebar on desktop. */
export function AdminNav({ email }: { email: string }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/orders") : pathname.startsWith(href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-coal-700 bg-coal-950/95 pb-safe backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:flex md:w-56 md:flex-col md:border-r md:border-t-0 md:p-4">
        <div className="mb-6 hidden md:block">
          <Logo />
        </div>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active(l.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[0.7rem] font-semibold md:flex-row md:gap-3 md:rounded-xl md:px-3 md:py-2.5 md:text-sm ${
              active(l.href) ? "text-flame-400 md:bg-coal-800" : "text-cream-300"
            }`}
          >
            <span aria-hidden className="text-xl md:text-base">
              {l.icon}
            </span>
            {t(l.key)}
          </Link>
        ))}
        <div className="mt-auto hidden space-y-2 text-xs text-cream-500 md:block">
          <p className="truncate">{email}</p>
          <a href="/" target="_blank" className="block font-semibold text-cream-300 hover:text-cream-50">
            {t("site")} ↗
          </a>
          <form action={logoutAction}>
            <button type="submit" className="font-semibold text-cream-300 hover:text-cream-50">
              {t("logout")}
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}
