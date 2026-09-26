import type { PublicMenu } from "@/lib/types";
import type { CartLine } from "./store";

export interface ComboSuggestion {
  comboItemId: string;
  /** Separate price of the matched items minus the combo price. */
  savings: number;
  /** How many units to take from each cart line when switching to the combo. */
  consume: { key: string; quantity: number }[];
}

/**
 * Finds the active combo that saves the customer the most, given the cart.
 * Component prices use the variant price only (add-ons stay on the original line).
 */
export function findBestCombo(lines: CartLine[], menu: PublicMenu): ComboSuggestion | null {
  let best: ComboSuggestion | null = null;

  for (const combo of menu.combos) {
    const comboItem = menu.items[combo.itemId];
    if (!comboItem?.inStock || comboItem.variants.length === 0) continue;
    const comboPrice = comboItem.variants[0].price;

    const remaining = new Map(lines.map((l) => [l.key, l.quantity]));
    const consume = new Map<string, number>();
    let separate = 0;
    let complete = true;

    for (const component of combo.components) {
      // Cheapest matching units first, so the saving shown is never overstated.
      const candidates = lines
        .filter((l) => l.itemId === component.itemId && (!component.variantId || l.variantId === component.variantId))
        .map((l) => ({ line: l, price: menu.items[l.itemId]?.variants.find((v) => v.id === l.variantId)?.price }))
        .filter((c): c is { line: CartLine; price: number } => c.price !== undefined)
        .sort((a, b) => a.price - b.price);

      let needed = component.quantity;
      for (const { line, price } of candidates) {
        const available = remaining.get(line.key) ?? 0;
        const take = Math.min(available, needed);
        if (take <= 0) continue;
        remaining.set(line.key, available - take);
        consume.set(line.key, (consume.get(line.key) ?? 0) + take);
        separate += take * price;
        needed -= take;
        if (needed === 0) break;
      }
      if (needed > 0) {
        complete = false;
        break;
      }
    }

    const savings = separate - comboPrice;
    if (complete && savings > 0 && (!best || savings > best.savings)) {
      best = {
        comboItemId: combo.itemId,
        savings,
        consume: [...consume].map(([key, quantity]) => ({ key, quantity })),
      };
    }
  }
  return best;
}
