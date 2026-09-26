import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { tr } from "@/lib/localize";
import { formatPhone } from "@/lib/phone";
import type { RestaurantSettings } from "@/lib/types";
import { InstagramIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import { Logo } from "./Logo";

export function Footer({ dict, locale, settings }: { dict: Dictionary; locale: Locale; settings: RestaurantSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-coal-700 bg-coal-950 pb-28 pt-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Logo subtitle={dict.brand.logoSubtitle} />
          <p className="font-display text-lg uppercase text-flame-400">{dict.brand.slogan}</p>
        </div>
        <ul className="space-y-3 text-cream-200">
          <li>
            <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 hover:text-flame-300">
              <PhoneIcon /> {formatPhone(settings.phone)}
            </a>
          </li>
          <li className="inline-flex items-start gap-2">
            <PinIcon className="mt-0.5 shrink-0" /> {tr(settings.address, locale)}
          </li>
        </ul>
        <div>
          <a
            href={`https://instagram.com/${settings.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cream-200 hover:text-flame-300"
          >
            <InstagramIcon /> @{settings.instagram}
          </a>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-4 text-xs text-cream-500">
        © {year} {settings.name}. {dict.footer.rights} · {dict.footer.madeWith} 🔥
      </p>
    </footer>
  );
}
