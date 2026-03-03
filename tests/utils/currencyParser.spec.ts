// tests/utils/currencyParser.spec.ts
import { describe, it, expect } from "vitest";
import { parseCurrency } from "@/utils/currencyParser";

describe("parseCurrency", () => {
  // -------------------------------------------------------------------------
  // Guard clauses — invalid input
  // -------------------------------------------------------------------------
  describe("invalid input", () => {
    it("returns null for an empty string", () => {
      expect(parseCurrency("", "en-US")).toBeNull();
    });

    it("returns null for a non-string value", () => {
      // @ts-expect-error — deliberately testing runtime guard
      expect(parseCurrency(null, "en-US")).toBeNull();
    });

    it("returns null for a string with no numeric content", () => {
      expect(parseCurrency("abc", "en-US")).toBeNull();
    });

    it("returns null for zero", () => {
      expect(parseCurrency("0", "en-US")).toBeNull();
    });

    it("returns null for a negative number", () => {
      expect(parseCurrency("-5.00", "en-US")).toBeNull();
    });

    it("returns null for a string with multiple decimal separators", () => {
      expect(parseCurrency("1.23.45", "en-US")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // en-US — decimal: ".", thousands: ","
  // -------------------------------------------------------------------------
  describe("en-US locale", () => {
    const locale = "en-US";

    it("parses a plain integer string", () => {
      expect(parseCurrency("100", locale)).toBe(100);
    });

    it("parses a decimal amount", () => {
      expect(parseCurrency("1234.56", locale)).toBe(1234.56);
    });

    it("parses a formatted currency string with symbol and thousands separator", () => {
      expect(parseCurrency("$1,234.56", locale)).toBe(1234.56);
    });

    it("parses a value with thousands separator but no decimal", () => {
      expect(parseCurrency("1,000", locale)).toBe(1000);
    });

    it("strips whitespace", () => {
      expect(parseCurrency("  50.00  ", locale)).toBe(50);
    });
  });

  // -------------------------------------------------------------------------
  // de-DE — decimal: ",", thousands: "."
  // -------------------------------------------------------------------------
  describe("de-DE locale", () => {
    const locale = "de-DE";

    it("parses a decimal amount using comma as decimal separator", () => {
      expect(parseCurrency("1234,56", locale)).toBe(1234.56);
    });

    it("parses a formatted string with period as thousands separator", () => {
      expect(parseCurrency("1.234,56", locale)).toBe(1234.56);
    });

    it("parses a whole number with thousands separator", () => {
      expect(parseCurrency("2.000", locale)).toBe(2000);
    });
  });

  // -------------------------------------------------------------------------
  // fr-FR — decimal: ",", thousands: " " (narrow no-break space)
  // -------------------------------------------------------------------------
  describe("fr-FR locale", () => {
    const locale = "fr-FR";

    it("parses a decimal amount using comma as decimal separator", () => {
      expect(parseCurrency("1234,56", locale)).toBe(1234.56);
    });

    it("parses a formatted euro string", () => {
      // Intl formats fr-FR as "1 234,56 €" — spaces are thousands separators
      expect(parseCurrency("1 234,56 €", locale)).toBe(1234.56);
    });
  });

  // -------------------------------------------------------------------------
  // ja-JP — no decimal places in standard currency
  // -------------------------------------------------------------------------
  describe("ja-JP locale", () => {
    const locale = "ja-JP";

    it("parses a plain yen amount", () => {
      expect(parseCurrency("1000", locale)).toBe(1000);
    });

    it("parses a formatted yen string", () => {
      expect(parseCurrency("￥1,000", locale)).toBe(1000);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe("edge cases", () => {
    it("parses the smallest valid positive value", () => {
      expect(parseCurrency("0.01", "en-US")).toBe(0.01);
    });

    it("parses a large amount correctly", () => {
      expect(parseCurrency("$1,000,000.00", "en-US")).toBe(1000000);
    });
  });
});
