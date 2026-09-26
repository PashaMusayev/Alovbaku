/** Formats an E.164 Azerbaijani number for display: +994552437999 → "+994 55 243 79 99". */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}
