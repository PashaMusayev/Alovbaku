const FOLD: Record<string, string> = { ə: "e", ı: "i", i̇: "i", ö: "o", ü: "u", ç: "c", ş: "s", ğ: "g", ё: "е" };

/** Lowercases and folds Azerbaijani letters so "doner" finds "Dönər" and "sezar" finds "Sezar". */
export function foldForSearch(text: string): string {
  return text
    .toLocaleLowerCase("az")
    .replace(/[əıöüçşğё]|i̇/g, (ch) => FOLD[ch] ?? ch)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

export function matchesQuery(haystack: string, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const h = foldForSearch(haystack);
  return q.split(/\s+/).every((word) => h.includes(word));
}
