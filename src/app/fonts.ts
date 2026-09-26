import { Inter, Oswald } from "next/font/google";

export const oswald = Oswald({
  subsets: ["latin", "latin-ext", "cyrillic"],
  // Variable font: one file per subset instead of one per weight.
  variable: "--font-oswald",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
  // Body text renders fine in the size-adjusted fallback; keep bandwidth for the hero heading font.
  preload: false,
});
