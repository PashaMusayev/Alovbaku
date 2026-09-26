/**
 * Absolute site URL for canonical links, Open Graph and Telegram buttons.
 * NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is used automatically.
 */
export function getSiteUrl(): URL {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  ];
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      return new URL(candidate.trim());
    } catch {
      /* ignore malformed value, try the next one */
    }
  }
  return new URL("http://localhost:3000");
}
