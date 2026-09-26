import { foldForSearch } from "@/lib/search";

/** URL-safe slug from an Azerbaijani name: "Ət dönər Lavaşda" → "et-doner-lavasda". */
export function slugify(text: string): string {
  return (
    foldForSearch(text)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "mehsul"
  );
}

export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}
