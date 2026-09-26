import { describe, expect, it } from "vitest";
import { formatPrice, parsePriceInput, toQepik } from "@/lib/money";

const n = (s: string) => s.replace(/ /g, " ");

describe("formatPrice", () => {
  it("uses comma decimals and the manat sign after the amount", () => {
    expect(n(formatPrice(870))).toBe("8,70 ₼");
    expect(n(formatPrice(450))).toBe("4,50 ₼");
    expect(n(formatPrice(5))).toBe("0,05 ₼");
    expect(n(formatPrice(123456))).toBe("1 234,56 ₼");
  });
  it("converts and parses manat amounts without float drift", () => {
    expect(toQepik(4.1)).toBe(410);
    expect(toQepik(12.2)).toBe(1220);
    expect(parsePriceInput("8,70")).toBe(870);
    expect(parsePriceInput("8.7 ₼")).toBe(870);
    expect(parsePriceInput("abc")).toBeNull();
  });
});
