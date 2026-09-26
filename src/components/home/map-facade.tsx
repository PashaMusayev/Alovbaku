"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinIcon } from "@/components/ui/icons";

/** Loads the Google Maps iframe only on demand — keeps the page fast (no API key needed). */
export function MapFacade({ query }: { query: string }) {
  const t = useTranslations("home");
  const [show, setShow] = useState(false);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-coal-800 ring-1 ring-coal-700 sm:aspect-video">
      {show ? (
        <iframe
          title={t("mapTitle")}
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_45%,#ff5a1f33,transparent_60%),repeating-linear-gradient(45deg,#1f1a17_0_12px,#231d1a_12px_24px)]"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-5 py-3 font-bold text-coal-950">
            <MapPinIcon /> {t("showMap")}
          </span>
        </button>
      )}
    </div>
  );
}
