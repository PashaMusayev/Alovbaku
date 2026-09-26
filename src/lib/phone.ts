/** "+994552437999" → "+994 55 243 79 99" */
export function formatPhone(e164: string): string {
  const m = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

export const telHref = (e164: string) => `tel:${e164}`;
export const whatsappHref = (e164: string, text?: string) =>
  `https://wa.me/${e164.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export const instagramHref = (handle: string) => `https://instagram.com/${handle.replace(/^@/, "")}`;
