import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPhone, telHref } from "@/lib/phone";
import { PhoneIcon } from "@/components/ui/icons";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

export function Header({ phone }: { phone: string }) {
  const t = useTranslations("nav");
  return (
    <header className="sticky top-0 z-40 border-b border-coal-700/60 bg-coal-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" className="rounded-md">
          <Logo />
          <span className="sr-only"> — {t("home")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/menu"
            className="hidden h-11 items-center rounded-full px-3 text-sm font-semibold text-cream-100 hover:bg-coal-800 sm:inline-flex"
          >
            {t("menu")}
          </Link>
          <a
            href={telHref(phone)}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-flame-500 px-3 text-sm font-bold text-coal-950 hover:bg-flame-400"
          >
            <PhoneIcon width={16} height={16} />
            <span className="hidden sm:inline">{formatPhone(phone)}</span>
            <span className="sm:hidden">{t("call")}</span>
            <span className="sr-only sm:hidden"> {formatPhone(phone)}</span>
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
