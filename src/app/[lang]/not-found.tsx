"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";

export default function NotFound() {
  const { dict, href } = useI18n();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-flame-500">404</p>
      <h1 className="section-title">{dict.errors.notFound}</h1>
      <Link href={href("/")} className="btn-primary">
        {dict.errors.backHome}
      </Link>
    </div>
  );
}
