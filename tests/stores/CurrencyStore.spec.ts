import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useCurrencyStore } from "@/stores/CurrencyStore";
import type { NumberFormat } from "@/types/CommonTypes";
import { appName } from "@/utils/SystemDefaults";

// Mock SystemDefaults
vi.mock('@/utils/SystemDefaults.ts', () => ({
  defaultCurrencyCode: 'USD',
  defaultMinPrecision: 2,
  defaultMaxPrecision: 2,
  defaultThousandsSeparator: true,
  defaultUseBankersRounding: false,
  defaultNegativeZero: false,
  defaultCurrencyDisplay: 'symbol',
  defaultCurrencySign: 'standard',
  appName: 'TestApp'
}));

type CurrencyStoreInstance = ReturnType<typeof useCurrencyStore>;

describe("CurrencyStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default settings when no localStorage exists", () => {
      const store = useCurrencyStore();

      expect(store.minPrecision).toBe(2);
      expect(store.maxPrecision).toBe(2);
      expect(store.thousandsSeparator).toBe(true);
      expect(store.useBankersRounding).toBe(false);
      expect(store.negativeZero).toBe(false);
      expect(store.currency).toBe('USD');
      expect(store.currencyDisplay).toBe('symbol');
      expect(store.currencySign).toBe('standard');
    });

    it("should initialize with saved settings from localStorage", () => {
      const storageKey = `${appName}.Currency`;
      const savedFormat: NumberFormat = {
        minPrecision: 0,
        maxPrecision: 4,
        thousandsSeparator: false,
        useBankersRounding: true,
        negativeZero: true,
        currency: 'EUR',
        currencyDisplay: 'code',
        currencySign: 'accounting'
      };
      const savedData = { format: savedFormat };

      localStorage.setItem(storageKey, JSON.stringify(savedData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useCurrencyStore();

      expect(store.minPrecision).toBe(0);
      expect(store.maxPrecision).toBe(4);
      expect(store.thousandsSeparator).toBe(false);
      expect(store.useBankersRounding).toBe(true);
      expect(store.negativeZero).toBe(true);
      expect(store.currency).toBe('EUR');
      expect(store.currencyDisplay).toBe('code');
      expect(store.currencySign).toBe('accounting');
    });

    it("should fall back to defaults when localStorage has malformed JSON", () => {
      const storageKey = `${appName}.Currency`;
      localStorage.setItem(storageKey, 'invalid json {');

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useCurrencyStore();

      // Should use defaults
      expect(store.currency).toBe('USD');
      expect(store.maxPrecision).toBe(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse Currency storage'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should use correct storage key format", () => {
      const store = useCurrencyStore();
      store.updateNumberFormat({ currency: 'JPY' });

      const storageKey = `${appName}.Currency`;
      const savedData = localStorage.getItem(storageKey);

      expect(savedData).toBeTruthy();
      const parsed = JSON.parse(savedData!);
      expect(parsed).toHaveProperty('format');
      expect(parsed.format.currency).toBe('JPY');
    });

    it("should handle partial saved data by filling in defaults", () => {
      const storageKey = `${appName}.Currency`;
      const partialFormat = {
        format: {
          currency: 'GBP',
          maxPrecision: 3
          // Missing other properties
        }
      };

      localStorage.setItem(storageKey, JSON.stringify(partialFormat));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useCurrencyStore();

      // Saved properties
      expect(store.currency).toBe('GBP');
      expect(store.maxPrecision).toBe(3);

      // Default properties (missing from saved data)
      expect(store.thousandsSeparator).toBe(true);
      expect(store.useBankersRounding).toBe(false);
    });
  });

  describe("numberFormat computed property", () => {
    it("should correctly expose the numberFormat computed property", () => {
      const store = useCurrencyStore();
      const format = store.numberFormat;

      expect(format).toBeTypeOf("object");
      expect(format.currency).toBe('USD');
      expect(format.maxPrecision).toBe(2);
      expect(format.thousandsSeparator).toBe(true);
      expect(format.minPrecision).toBe(2);
      expect(format.useBankersRounding).toBe(false);
      expect(format.negativeZero).toBe(false);
      expect(format.currencyDisplay).toBe('symbol');
      expect(format.currencySign).toBe('standard');
    });

    it("should reactively update when individual properties change", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({ currency: 'EUR', maxPrecision: 4 });

      const format = store.numberFormat;
      expect(format.currency).toBe('EUR');
      expect(format.maxPrecision).toBe(4);
    });
  });

  describe("updateNumberFormat", () => {
    it("should update multiple properties via updateNumberFormat action", () => {
      const store = useCurrencyStore();

      const newPayload: Partial<NumberFormat> = {
        maxPrecision: 4,
        thousandsSeparator: false,
        currency: "JPY",
        currencyDisplay: "code",
      };

      store.updateNumberFormat(newPayload);

      expect(store.maxPrecision).toBe(4);
      expect(store.thousandsSeparator).toBe(false);
      expect(store.currency).toBe("JPY");
      expect(store.currencyDisplay).toBe("code");

      expect(store.numberFormat.maxPrecision).toBe(4);
      expect(store.numberFormat.currency).toBe("JPY");
    });

    it("should update specific properties and leave others unchanged", () => {
      const store = useCurrencyStore();
      const initialCurrency = store.currency;
      const initialCurrencySign = store.currencySign;

      store.updateNumberFormat({
        minPrecision: 1,
        maxPrecision: 5,
      });

      expect(store.minPrecision).toBe(1);
      expect(store.maxPrecision).toBe(5);
      expect(store.currency).toBe(initialCurrency);
      expect(store.currencySign).toBe(initialCurrencySign);
    });

    it("should handle empty payload without changing state", () => {
      const store = useCurrencyStore();
      const initialMaxPrecision = store.maxPrecision;
      const initialCurrencySign = store.currencySign;
      const initialNegativeZero = store.negativeZero;

      store.updateNumberFormat({});

      expect(store.maxPrecision).toBe(initialMaxPrecision);
      expect(store.currencySign).toBe(initialCurrencySign);
      expect(store.negativeZero).toBe(initialNegativeZero);
    });

    it("should update negativeZero property when explicitly provided", () => {
      const store = useCurrencyStore();
      const initialNegativeZero = store.negativeZero;

      store.updateNumberFormat({
        negativeZero: !initialNegativeZero,
      });

      expect(store.negativeZero).toBe(!initialNegativeZero);
      expect(store.numberFormat.negativeZero).toBe(!initialNegativeZero);
    });

    it("should update all properties when all are provided", () => {
      const store = useCurrencyStore();

      const allProperties: Partial<NumberFormat> = {
        minPrecision: 0,
        maxPrecision: 6,
        thousandsSeparator: false,
        useBankersRounding: true,
        negativeZero: true,
        currency: 'GBP',
        currencyDisplay: 'name',
        currencySign: 'accounting'
      };

      store.updateNumberFormat(allProperties);

      expect(store.minPrecision).toBe(0);
      expect(store.maxPrecision).toBe(6);
      expect(store.thousandsSeparator).toBe(false);
      expect(store.useBankersRounding).toBe(true);
      expect(store.negativeZero).toBe(true);
      expect(store.currency).toBe('GBP');
      expect(store.currencyDisplay).toBe('name');
      expect(store.currencySign).toBe('accounting');
    });

    it("should persist settings to localStorage after update", () => {
      const store = useCurrencyStore();
      const storageKey = `${appName}.Currency`;

      store.updateNumberFormat({
        currency: 'EUR',
        maxPrecision: 3,
        thousandsSeparator: false
      });

      const savedData = localStorage.getItem(storageKey);
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed.format.currency).toBe('EUR');
      expect(parsed.format.maxPrecision).toBe(3);
      expect(parsed.format.thousandsSeparator).toBe(false);
    });

    it("should overwrite previous localStorage values", () => {
      const store = useCurrencyStore();
      const storageKey = `${appName}.Currency`;

      store.updateNumberFormat({ currency: 'JPY' });
      expect(JSON.parse(localStorage.getItem(storageKey)!).format.currency).toBe('JPY');

      store.updateNumberFormat({ currency: 'EUR' });
      expect(JSON.parse(localStorage.getItem(storageKey)!).format.currency).toBe('EUR');
    });

    it("should handle boolean false values correctly", () => {
      const store = useCurrencyStore();

      // Set to true first
      store.updateNumberFormat({
        thousandsSeparator: true,
        useBankersRounding: true,
        negativeZero: true
      });

      // Now set to false
      store.updateNumberFormat({
        thousandsSeparator: false,
        useBankersRounding: false,
        negativeZero: false
      });

      expect(store.thousandsSeparator).toBe(false);
      expect(store.useBankersRounding).toBe(false);
      expect(store.negativeZero).toBe(false);
    });

    it("should handle zero and undefined for minPrecision correctly", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({ minPrecision: 0 });
      expect(store.minPrecision).toBe(0);

      store.updateNumberFormat({ minPrecision: undefined });
      expect(store.minPrecision).toBe(0); // Should remain 0, not undefined
    });
  });

  describe("Multiple store instances", () => {
    it("should share state across multiple store instances", () => {
      const store1 = useCurrencyStore();
      store1.updateNumberFormat({ currency: 'EUR', maxPrecision: 4 });

      const store2 = useCurrencyStore();

      expect(store2.currency).toBe('EUR');
      expect(store2.maxPrecision).toBe(4);
    });
  });

  describe("Persistence across sessions", () => {
    it("should restore settings from localStorage in new session", () => {
      let store = useCurrencyStore();
      store.updateNumberFormat({
        currency: 'GBP',
        maxPrecision: 5,
        useBankersRounding: true
      });

      vi.resetModules();
      setActivePinia(createPinia());
      store = useCurrencyStore();

      expect(store.currency).toBe('GBP');
      expect(store.maxPrecision).toBe(5);
      expect(store.useBankersRounding).toBe(true);
    });

    it("should handle cleared localStorage gracefully", () => {
      const store = useCurrencyStore();
      store.updateNumberFormat({ currency: 'EUR', maxPrecision: 4 });

      localStorage.clear();

      vi.resetModules();
      setActivePinia(createPinia());
      const newStore = useCurrencyStore();

      // Should fall back to defaults
      expect(newStore.currency).toBe('USD');
      expect(newStore.maxPrecision).toBe(2);
    });
  });

  describe("Edge cases", () => {
    it("should handle localStorage quota exceeded gracefully", () => {
      const store = useCurrencyStore();

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => {
        store.updateNumberFormat({ currency: 'EUR' });
      }).toThrow();

      setItemSpy.mockRestore();
    });

    it("should handle missing format property in localStorage object", () => {
      const storageKey = `${appName}.Currency`;
      const invalidData = { wrongProperty: 'value' };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useCurrencyStore();

      // Should use defaults since format is missing
      expect(store.currency).toBe('USD');
      expect(store.maxPrecision).toBe(2);
    });

    it("should handle invalid CurrencyDisplay values", () => {
      const store = useCurrencyStore();

      // TypeScript will accept this due to casting, but it's not a valid value
      store.updateNumberFormat({ currencyDisplay: 'invalid' as any });

      expect(store.currencyDisplay).toBe('invalid');
    });

    it("should handle invalid CurrencySign values", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({ currencySign: 'invalid' as any });

      expect(store.currencySign).toBe('invalid');
    });

    it("should handle negative precision values", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({
        minPrecision: -1,
        maxPrecision: -5
      });

      expect(store.minPrecision).toBe(-1);
      expect(store.maxPrecision).toBe(-5);
    });

    it("should handle very large precision values", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({
        minPrecision: 100,
        maxPrecision: 999
      });

      expect(store.minPrecision).toBe(100);
      expect(store.maxPrecision).toBe(999);
    });

    it("should handle empty string currency code", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({ currency: '' });

      expect(store.currency).toBe('');
    });
  });

  describe("State consistency", () => {
    it("should keep numberFormat computed in sync with individual refs", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({
        minPrecision: 1,
        maxPrecision: 3,
        currency: 'CHF'
      });

      const format = store.numberFormat;

      expect(format.minPrecision).toBe(store.minPrecision);
      expect(format.maxPrecision).toBe(store.maxPrecision);
      expect(format.currency).toBe(store.currency);
      expect(format.thousandsSeparator).toBe(store.thousandsSeparator);
    });

    it("should maintain consistency through multiple updates", () => {
      const store = useCurrencyStore();

      store.updateNumberFormat({ currency: 'EUR' });
      store.updateNumberFormat({ maxPrecision: 3 });
      store.updateNumberFormat({ thousandsSeparator: false });

      expect(store.numberFormat).toEqual({
        minPrecision: store.minPrecision,
        maxPrecision: 3,
        thousandsSeparator: false,
        useBankersRounding: store.useBankersRounding,
        negativeZero: store.negativeZero,
        currency: 'EUR',
        currencyDisplay: store.currencyDisplay,
        currencySign: store.currencySign
      });
    });
  });
});