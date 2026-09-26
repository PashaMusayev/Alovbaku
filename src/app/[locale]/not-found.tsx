import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-heading text-7xl font-bold text-flame-500">404</p>
      <h1 className="mt-2 font-heading text-3xl text-cream-50">{t("title")}</h1>
      <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-flame-500 px-6 font-bold text-coal-950">
        {t("back")}
      </Link>
    </div>
  );
}
