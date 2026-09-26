import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/money";

export function WoltBanner({ text, maxSaving }: { text: string; maxSaving: number }) {
  const t = useTranslations("wolt");
  return (
    <aside className="mx-auto mt-5 max-w-6xl px-4">
      <Link
        href="/menu"
        className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-ember-700 via-ember-600 to-flame-600 p-4 text-cream-50 ring-1 ring-flame-500/50"
      >
        <span className="text-3xl" aria-hidden>
          💸
        </span>
        <span className="flex-1">
          <span className="block font-heading text-lg font-bold">{text}</span>
          {maxSaving > 0 && (
            <span className="block text-sm text-cream-100/90">{t("savingsUpTo", { amount: formatPrice(maxSaving) })}</span>
          )}
        </span>
        <span className="hidden rounded-full bg-cream-50 px-3 py-1.5 text-sm font-bold text-coal-950 sm:inline">{t("cta")}</span>
      </Link>
    </aside>
  );
}
