import { priceSelection } from "@/lib/menu/pricing";
import type { PublicMenu } from "@/lib/types";
import type { CartLine } from "./store";

export interface CartLineView {
  line: CartLine;
  unitPrice: number;
  lineTotal: number;
  /** False when the item/variant/add-on no longer exists or is out of stock. */
  valid: boolean;
}

/** Display-only totals. The server recomputes everything on order submission. */
export function computeCart(lines: CartLine[], menu: PublicMenu) {
  const views: CartLineView[] = lines.map((line) => {
    const priced = priceSelection(line, menu.items, menu.addonGroups);
    return "error" in priced
      ? { line, unitPrice: 0, lineTotal: 0, valid: false }
      : { line, unitPrice: priced.unitPrice, lineTotal: priced.lineTotal, valid: true };
  });
  const valid = views.filter((v) => v.valid);
  return {
    views,
    count: valid.reduce((n, v) => n + v.line.quantity, 0),
    subtotal: valid.reduce((n, v) => n + v.lineTotal, 0),
  };
}
