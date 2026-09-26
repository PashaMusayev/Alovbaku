import { describe, expect, it } from "vitest";
import { azn, formatPrice, parsePrice } from "./money";

describe("money", () => {
  it("formats qəpik as '8,70 ₼' (never '₼8.7')", () => {
    expect(formatPrice(870)).toBe("8,70 ₼");
    expect(formatPrice(450)).toBe("4,50 ₼");
    expect(formatPrice(0)).toBe("0,00 ₼");
    expect(formatPrice(123456)).toBe("1 234,56 ₼");
  });
  it("converts manat to integer qəpik without float drift", () => {
    expect(azn(4.1)).toBe(410);
    expect(azn(12.2)).toBe(1220);
    expect(azn(0.1 + 0.2)).toBe(30);
  });
  it("parses admin input", () => {
    expect(parsePrice("8,70")).toBe(870);
    expect(parsePrice("8.7 ₼")).toBe(870);
    expect(parsePrice("12")).toBe(1200);
    expect(parsePrice("abc")).toBeNull();
    expect(parsePrice("1,234")).toBeNull();
  });
});
