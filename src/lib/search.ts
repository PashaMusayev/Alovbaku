/**
 * Normalizes text for forgiving search: lowercases and folds Azerbaijani /
 * Turkish letters so "doner" matches "dönər" and "sasliq" matches "şaşlıq".
 */
const FOLD: Record<string, string> = {
  ə: "e", ı: "i", i̇: "i", ö: "o", ü: "u", ç: "c", ş: "s", ğ: "g", ё: "е",
};

export function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase("az")
    .replace(/[əıöüçşğё]|i̇/g, (ch) => FOLD[ch] ?? ch)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
