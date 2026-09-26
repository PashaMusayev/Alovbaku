import { FlameIcon } from "@/components/ui/icons";

/** Wordmark: flame + "ALOV BAKU". Text-based so it stays crisp and readable at any size. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className="inline-flex items-center gap-1.5 select-none" translate="no">
      <span
        className={`grid place-items-center rounded-full bg-gradient-to-b from-gold-400 via-flame-500 to-ember-600 text-coal-950 ${
          big ? "h-12 w-12" : "h-9 w-9"
        }`}
      >
        <FlameIcon width={big ? 28 : 22} height={big ? 28 : 22} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-heading font-bold text-cream-50 ${big ? "text-3xl" : "text-[1.35rem]"}`}>Alov</span>
        <span className={`font-heading font-semibold tracking-[0.32em] text-flame-500 ${big ? "text-sm" : "text-[0.62rem]"}`}>
          Baku
        </span>
      </span>
    </span>
  );
}
