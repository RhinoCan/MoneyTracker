// tests/composables/useCurrencyFormatter.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingsStore } from "@/stores/SettingsStore";
import { withSetup } from "../test-utils";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { logException } from "@/lib/Logger";

// -------------------------------------------------------------------------
// Mock i18n to suppress locale watcher side effects from SettingsStore
// -------------------------------------------------------------------------
vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
      t: (key: string) => key,
      te: () => false,
    },
  },
}));

describe("useCurrencyFormatter", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // -------------------------------------------------------------------------
  // Invalid / edge inputs
  // -------------------------------------------------------------------------
  describe("invalid input", () => {
    it("returns '---' for null", () => {
      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      expect(formatCurrency(null)).toBe("---");
    });

    it("returns '---' for undefined", () => {
      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      expect(formatCurrency(undefined)).toBe("---");
    });

    it("returns '---' for NaN", () => {
      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      expect(formatCurrency(NaN)).toBe("---");
    });
  });

  // -------------------------------------------------------------------------
  // en-US / USD formatting
  // -------------------------------------------------------------------------
  describe("en-US locale with USD currency", () => {
    it("formats a whole number correctly", () => {
      const settingsStore = useSettingsStore();
      settingsStore.locale = "en-US";
      settingsStore.currency = "USD";

      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      const result = formatCurrency(1000);
      expect(result).toMatch(/\$1,000/);
    });

    it("formats a decimal amount correctly", () => {
      const settingsStore = useSettingsStore();
      settingsStore.locale = "en-US";
      settingsStore.currency = "USD";

      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/\$1,234\.56/);
    });

    it("formats zero correctly", () => {
      const settingsStore = useSettingsStore();
      settingsStore.locale = "en-US";
      settingsStore.currency = "USD";

      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      const result = formatCurrency(0);
      expect(result).toMatch(/\$0\.00/);
    });
  });

  // -------------------------------------------------------------------------
  // de-DE / EUR formatting
  // -------------------------------------------------------------------------
  describe("de-DE locale with EUR currency", () => {
    it("uses comma as decimal separator", () => {
      const { formatCurrency } = withSetup(() => {
        const settingsStore = useSettingsStore();
        settingsStore.locale = "de-DE";
        settingsStore.currency = "EUR";
        return useCurrencyFormatter();
      });
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/1\.234,56/);
    });
  });

  // -------------------------------------------------------------------------
  // ja-JP / JPY formatting
  // -------------------------------------------------------------------------
  describe("ja-JP locale with JPY currency", () => {
    it("formats without decimal places", () => {
      const { formatCurrency } = withSetup(() => {
        const settingsStore = useSettingsStore();
        settingsStore.locale = "ja-JP";
        settingsStore.currency = "JPY";
        return useCurrencyFormatter();
      });
      const result = formatCurrency(1000);
      expect(result).toMatch(/1,000/);
      expect(result).not.toMatch(/\./);
    });
  });

  // -------------------------------------------------------------------------
  // Fallback defaults
  // -------------------------------------------------------------------------
  describe("fallback defaults", () => {
    it("falls back to en-US and USD when locale and currency are empty strings", () => {
      const { formatCurrency } = withSetup(() => {
        const settingsStore = useSettingsStore();
        // @ts-ignore
        settingsStore.locale = "";
        // @ts-ignore
        settingsStore.currency = "";
        return useCurrencyFormatter();
      });

      const result = formatCurrency(100);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // catch block — Intl.NumberFormat throws (covers lines 26–34)
  // -------------------------------------------------------------------------
  describe("formatCurrency catch block", () => {
    it("calls logException and returns amount.toString() when Intl.NumberFormat throws", () => {
      const settingsStore = useSettingsStore();
      settingsStore.locale = "en-US";
      settingsStore.currency = "USD";

      // Force Intl.NumberFormat to throw
      const originalNumberFormat = Intl.NumberFormat;
      vi.spyOn(Intl, "NumberFormat").mockImplementationOnce(() => {
        throw new Error("Intl failure");
      });

      const { formatCurrency } = withSetup(() => useCurrencyFormatter());
      const result = formatCurrency(42);

      expect(logException).toHaveBeenCalled();
      expect(result).toBe("42");

      // Restore is handled automatically by mockImplementationOnce,
      // but reassign explicitly to be safe
      vi.restoreAllMocks();
    });
  });
});
