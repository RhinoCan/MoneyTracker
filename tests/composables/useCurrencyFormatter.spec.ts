import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useLocaleStore } from "@/stores/LocaleStore";
import { useCurrencyStore } from "@/stores/CurrencyStore";
import { logException } from "@/utils/Logger";

// Mock the stores
vi.mock("@/stores/LocaleStore", () => ({
  useLocaleStore: vi.fn(),
}));

vi.mock("@/stores/CurrencyStore", () => ({
  useCurrencyStore: vi.fn(),
}));

// Mock Logger
vi.mock("@/utils/Logger", () => ({
  logException: vi.fn(),
}));

describe("useCurrencyFormatter", () => {
  let mockLocaleStore: any;
  let mockCurrencyStore: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default store states
    mockLocaleStore = { currentLocale: "en-US" };
    mockCurrencyStore = {
      numberFormat: {
        currency: "USD",
        currencyDisplay: "symbol",
        currencySign: "standard",
        minPrecision: 2,
        maxPrecision: 2,
        useGrouping: true,
      },
    };

    (useLocaleStore as any).mockReturnValue(mockLocaleStore);
    (useCurrencyStore as any).mockReturnValue(mockCurrencyStore);
  });

  it("should format money correctly for US Locale", () => {
    const { displayMoney } = useCurrencyFormatter();
    // Using a non-breaking space regex because Intl often uses them
    expect(displayMoney(1234.56).replace(/\u00A0/g, " ")).toBe("$1,234.56");
  });

  it("should return an empty string for null or undefined", () => {
    const { displayMoney } = useCurrencyFormatter();
    expect(displayMoney(null)).toBe("");
    expect(displayMoney(undefined)).toBe("");
  });

  it("should handle null/undefined in the success path (Line 60)", () => {
    const { displayMoney } = useCurrencyFormatter();
    expect(displayMoney(null)).toBe("");
    expect(displayMoney(undefined)).toBe("");
  });

  it("should create a canonical locale correctly (Line 42)", () => {
    // Case 1: Region exists - testing lowercase-UPPERCASE conversion
    mockLocaleStore.currentLocale = "EN-ca";
    let { displayMoney } = useCurrencyFormatter();
    // This forces the code to look up "en-CA" in your map
    expect(displayMoney(100)).toContain("$");

    // Case 2: No region - testing the lang.toLowerCase() branch
    mockLocaleStore.currentLocale = "JA";
    ({ displayMoney } = useCurrencyFormatter());
    // This forces the code to look up "ja" in your map
    expect(displayMoney(100)).toMatch(/￥|JPY/);
  });

  describe("Currency Inference Logic", () => {
    it("should infer CAD when locale is fr-CA and store is USD", () => {
      mockLocaleStore.currentLocale = "fr-CA";
      const { displayMoney } = useCurrencyFormatter();
      // French Canadian format: 1 234,56 $
      const result = displayMoney(1234.56).replace(/\u00A0/g, " ");
      expect(result).toContain("$");
      expect(result).toContain("1 234,56");
    });

    it("should infer JPY when locale is ja-JP and store is USD", () => {
      mockLocaleStore.currentLocale = "ja-JP";
      const { displayMoney } = useCurrencyFormatter();

      const result = displayMoney(100);
      // Japanese Yen usually has no decimals and uses the ¥ symbol
      expect(result).toMatch(/￥|JPY/);
    });

    it("should fallback to the store currency (USD) if locale is completely unknown", () => {
      mockLocaleStore.currentLocale = "xx-YY";
      const { displayMoney } = useCurrencyFormatter();
      expect(displayMoney(100)).toContain("$");
    });

    it("should use the store currency if store currency is NOT USD", () => {
      mockCurrencyStore.numberFormat.currency = "GBP";
      mockLocaleStore.currentLocale = "en-US";
      const { displayMoney } = useCurrencyFormatter();
      expect(displayMoney(10)).toContain("£");
    });
  });

  describe("Fallback Logic (Error Handling)", () => {
    it("should use the manual fallback string if Intl fails", () => {
      // Force Intl.NumberFormat to throw by passing a bad currency
      mockCurrencyStore.numberFormat.currency = "INVALID";

      const { displayMoney } = useCurrencyFormatter();
      const result = displayMoney(100.55);

      // Should hit line 66: `${effectiveCurrency} ${amount.toFixed(...)}`
      expect(result).toBe("INVALID 100.55");
      expect(logException).toHaveBeenCalled();
    });

    it("should handle null in the fallback path (Line 67)", () => {
      // Force the catch block
      mockCurrencyStore.numberFormat.currency = "INVALID";
      const { displayMoney } = useCurrencyFormatter();

      // This hits the 'if (amount == null) return ""' inside the catch block
      expect(displayMoney(null)).toBe("");
    });
  });
});
