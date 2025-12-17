import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useLocaleStore } from "@/stores/LocaleStore";
import { useCurrencyStore } from "@/stores/CurrencyStore";

describe("useCurrencyFormatter", () => {
  beforeEach(() => {
    // Create a fresh Pinia instance before each test
    setActivePinia(createPinia());
  });

  describe("Basic functionality", () => {
    it("formats USD currency with en-US locale", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(1234.56)).toBe("$1,234.56");
    });

    it("returns empty string for null amount", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(null)).toBe("");
      expect(displayMoney(undefined)).toBe("");
    });

    it("formats zero correctly", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(0)).toBe("$0.00");
    });
  });

  describe("Currency inference from locale", () => {
    it("infers CAD for en-CA locale when store currency is USD", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-CA";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "code", // Use 'code' to see 'CAD' in output
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should show CAD, not USD
      expect(result).toContain("CAD");
    });

    it("infers EUR for fr-FR locale when store currency is USD", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "fr-FR";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should show EUR symbol
      expect(result).toContain("€");
    });

    it("infers GBP for en-GB locale when store currency is USD", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-GB";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should show GBP symbol
      expect(result).toContain("£");
    });

    it("infers JPY for ja-JP locale when store currency is USD", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "ja-JP";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 0,
        maxPrecision: 0,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(1000);

      // JPY typically doesn't have decimal places
      // Note: ja-JP locale uses full-width yen sign (￥)
      expect(result).toMatch(/[¥￥]/);
    });

    it("does not infer currency when store currency is not USD", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-CA";
      currencyStore.updateNumberFormat({
        currency: "EUR",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should still show EUR, not CAD
      expect(result).toContain("€");
    });

    it("handles locale with lowercase language and uppercase region", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      // Test with non-canonical casing
      localeStore.currentLocale = "EN-ca";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "code", // Use 'code' to see 'CAD' in output
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should normalize to en-CA and infer CAD
      expect(result).toContain("CAD");
    });

    it("falls back to language code if full locale not in map", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      // en-NZ is not in the map, but 'en' might default
      localeStore.currentLocale = "en-NZ";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should still format without error
      expect(result).toBeTruthy();
    });
  });

  describe("Format options", () => {
    it("respects currencyDisplay option - symbol", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(100)).toContain("$");
    });

    it("respects currencyDisplay option - code", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "code",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(100)).toContain("USD");
    });

    it("respects precision options", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 3,
        maxPrecision: 3,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(100)).toBe("$100.000");
    });

    it("respects thousandsSeparator option when true", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(1234567.89)).toContain(",");
    });

    it("respects thousandsSeparator option when false", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: false,
      });

      const { displayMoney } = useCurrencyFormatter();

      const result = displayMoney(1234567.89);
      expect(result).not.toContain(",");
    });

    it("respects currencySign option - accounting", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "accounting",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      // Negative amounts should use accounting format (parentheses)
      const result = displayMoney(-100);
      expect(result).toContain("(");
      expect(result).toContain(")");
    });
  });

  describe("Reactivity", () => {
    it("updates formatting when locale changes", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      const resultUS = displayMoney(1234.56);
      expect(resultUS).toBe("$1,234.56");

      // Change locale to French
      localeStore.currentLocale = "fr-FR";

      const resultFR = displayMoney(1234.56);
      // French locale uses different separators and EUR
      expect(resultFR).toContain("€");
    });

    it("updates formatting when currency format options change", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(100)).toContain("$");

      // Change to code display
      currencyStore.updateNumberFormat({
        currencyDisplay: "code",
      });

      expect(displayMoney(100)).toContain("USD");
    });
  });

  describe("Edge cases and error handling", () => {
    it("handles negative amounts", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(-100)).toContain("-");
    });

    it("handles very large amounts", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      const result = displayMoney(999999999999.99);
      expect(result).toBeTruthy();
      expect(result).toContain("$");
    });

    it("handles very small decimal amounts", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(0.01)).toBe("$0.01");
    });

    it("handles invalid locale gracefully with fallback formatter", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Use an invalid locale that might cause Intl.NumberFormat to throw
      localeStore.currentLocale = "invalid-LOCALE-xyz";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      // Should still return a formatted string using fallback
      const result = displayMoney(100);
      expect(result).toBeTruthy();
      expect(result).toContain("USD");
      expect(result).toContain("100");

      consoleErrorSpy.mockRestore();
    });

    it("fallback formatter returns empty string for null/undefined", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localeStore.currentLocale = "invalid-LOCALE";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();

      expect(displayMoney(null)).toBe("");
      expect(displayMoney(undefined)).toBe("");

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Multiple currency scenarios", () => {
    it("formats EUR correctly", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "de-DE";
      currencyStore.updateNumberFormat({
        currency: "EUR",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(1234.56);

      expect(result).toContain("€");
    });

    it("formats GBP correctly", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en-GB";
      currencyStore.updateNumberFormat({
        currency: "GBP",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(1234.56);

      expect(result).toContain("£");
    });

    it("formats JPY correctly with no decimals", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "ja-JP";
      currencyStore.updateNumberFormat({
        currency: "JPY",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 0,
        maxPrecision: 0,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(1234);

      // Note: ja-JP locale uses full-width yen sign (￥)
      expect(result).toMatch(/[¥￥]/);
      expect(result).not.toContain(".");
    });
  });

  describe("Locale normalization", () => {
    it("normalizes locale with mixed case", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "Fr-ca";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "code", // Use 'code' to see 'CAD' in output
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should infer CAD from normalized fr-CA
      expect(result).toContain("CAD");
    });

    it("handles locale without region", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      localeStore.currentLocale = "en";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100);

      // Should still format properly
      expect(result).toBeTruthy();
      expect(result).toContain("$");
    });

    // Add this test to your existing "Edge cases and error handling" describe block

    it("forces Intl.NumberFormat error to trigger fallback formatter and console.error", () => {
      const localeStore = useLocaleStore();
      const currencyStore = useCurrencyStore();

      // Spy on console.error
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localeStore.currentLocale = "en-US";
      currencyStore.updateNumberFormat({
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        thousandsSeparator: true,
      });

      // Mock Intl.NumberFormat to throw an error
      const originalNumberFormat = Intl.NumberFormat;
      vi.spyOn(Intl, "NumberFormat").mockImplementationOnce(() => {
        throw new RangeError("Invalid currency code");
      });

      // This should trigger the composable's computed to re-evaluate with the mock
      const { displayMoney } = useCurrencyFormatter();

      // Call displayMoney which should use the fallback formatter
      const result = displayMoney(100);

      // COVERS LINE 75: Should have called console.error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[Currency Formatter] Failed to create formatter for locale"
        ),
        expect.any(Error)
      );

      // Should still return a formatted string using fallback
      expect(result).toBeTruthy();
      expect(result).toContain("USD");
      expect(result).toContain("100.00");

      // Restore mocks
      consoleErrorSpy.mockRestore();
      Intl.NumberFormat = originalNumberFormat;
    });
  });
});
