// tests/utils/SystemDefaults.spec.ts
import { describe, it, expect } from "vitest";
import {
  defaultCurrencyCode,
  getCurrencyDisplayNames,
} from "@/utils/SystemDefaults";

describe("SystemDefaults", () => {
  // -------------------------------------------------------------------------
  // Constants
  // -------------------------------------------------------------------------
  describe("constants", () => {
     it("defaultCurrencyCode is USD", () => {
      expect(defaultCurrencyCode).toBe("USD");
    });
  });

  // -------------------------------------------------------------------------
  // getCurrencyDisplayNames
  // -------------------------------------------------------------------------
  describe("getCurrencyDisplayNames", () => {
    it("returns the currency code unchanged", () => {
      const result = getCurrencyDisplayNames("USD", "en-US");
      expect(result.code).toBe("USD");
    });

    it("returns an English display name for USD", () => {
      const result = getCurrencyDisplayNames("USD", "en-US");
      expect(result.english).toMatch(/US Dollar/i);
    });

    it("returns an English display name for EUR", () => {
      const result = getCurrencyDisplayNames("EUR", "en-US");
      expect(result.english).toMatch(/Euro/i);
    });

    it("returns a localized name for JPY in ja-JP", () => {
      const result = getCurrencyDisplayNames("JPY", "ja-JP");
      // The Japanese name for JPY should differ from the English name
      expect(result.local).not.toBe(result.english);
    });

    it("returns a localized name for EUR in de-DE", () => {
      const result = getCurrencyDisplayNames("EUR", "de-DE");
      expect(typeof result.local).toBe("string");
      expect(result.local.length).toBeGreaterThan(0);
    });

    it("returns English and local names as strings for all supported currencies", () => {
      const currencies = ["USD", "CAD", "GBP", "EUR", "CHF", "CNY", "JPY", "KRW", "INR", "SAR", "RUB", "BRL"];
      currencies.forEach((currency) => {
        const result = getCurrencyDisplayNames(currency, "en-US");
        expect(typeof result.english).toBe("string");
        expect(result.english.length).toBeGreaterThan(0);
      });
    });

    it("falls back to the currency code when Intl cannot resolve the name", () => {
      const result = getCurrencyDisplayNames("XYZ", "en-US");
      // Unknown currency code — should fall back to "XYZ"
      expect(result.english).toBe("XYZ");
      expect(result.local).toBe("XYZ");
    });
  });
});
