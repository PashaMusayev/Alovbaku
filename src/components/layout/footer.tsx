import { useTranslations } from "next-intl";
import { formatPhone, instagramHref, telHref } from "@/lib/phone";
import type { PublicSettings } from "@/lib/types";
import { InstagramIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { Logo } from "./logo";

export function Footer({ settings }: { settings: PublicSettings }) {
  const t = useTranslations();
  return (
    <footer className="border-t border-coal-700/60 bg-coal-900 pb-28 pt-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Logo size="lg" />
          <p className="font-heading text-lg text-flame-400">{t("brand.slogan")}</p>
        </div>
        <ul className="space-y-3 text-sm text-cream-300">
          <li>
            <a href={telHref(settings.phone)} className="inline-flex items-center gap-2 hover:text-cream-50">
              <PhoneIcon width={16} height={16} /> {formatPhone(settings.phone)}
            </a>
          </li>
          <li>
            <a
              href={instagramHref(settings.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-cream-50"
            >
              <InstagramIcon width={16} height={16} /> @{settings.instagram}
            </a>
          </li>
          <li className="inline-flex items-center gap-2">
            <MapPinIcon width={16} height={16} /> {settings.address}
          </li>
        </ul>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-cream-500">
        {t("footer.rights", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
