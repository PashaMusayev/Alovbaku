import Image from "next/image";

/**
 * The restaurant's badge logo plus a large text wordmark next to it —
 * the badge's own lettering is too small to read at header size.
 */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  const px = big ? 64 : 44;
  return (
    <span className="inline-flex items-center gap-2 select-none" translate="no">
      <Image
        src={px > 48 ? "/brand/logo-192.webp" : "/brand/logo-96.webp"}
        alt=""
        width={px}
        height={px}
        priority={!big}
        unoptimized
        className="rounded-full shadow-[0_0_16px_rgba(255,90,31,0.35)]"
      />
      <span className="flex flex-col leading-none">
        <span className={`font-heading font-bold text-cream-50 ${big ? "text-3xl" : "text-[1.35rem]"}`}>Alov</span>
        <span className={`font-heading font-semibold tracking-[0.32em] text-flame-500 ${big ? "text-sm" : "text-[0.62rem]"}`}>
          Baku
        </span>
      </span>
    </span>
  );
}
