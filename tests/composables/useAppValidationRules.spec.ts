// tests/composables/useAppValidationRules.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingsStore } from "@/stores/SettingsStore";
import { withSetup } from "../test-utils";
import { useAppValidationRules } from "@/composables/useAppValidationRules";

vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
      t: (key: string, params?: Record<string, unknown>) => {
        // Return key with params interpolated so tests can assert on key names
        if (params) return `${key}:${JSON.stringify(params)}`;
        return key;
      },
      te: () => false,
    },
  },
}));

describe("useAppValidationRules", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // -------------------------------------------------------------------------
  // required
  // -------------------------------------------------------------------------
  describe("required", () => {
    it("returns true for a non-empty string", () => {
      const { required } = withSetup(() => useAppValidationRules());
      expect(required("hello")).toBe(true);
    });

    it("returns true for the number zero", () => {
      const { required } = withSetup(() => useAppValidationRules());
      expect(required(0)).toBe(true);
    });

    it("returns an error key for an empty string", () => {
      const { required } = withSetup(() => useAppValidationRules());
      expect(required("")).toBe("useApp.reqd");
    });

    it("returns an error key for null", () => {
      const { required } = withSetup(() => useAppValidationRules());
      expect(required(null)).toBe("useApp.reqd");
    });

    it("returns an error key for undefined", () => {
      const { required } = withSetup(() => useAppValidationRules());
      expect(required(undefined)).toBe("useApp.reqd");
    });
  });

  // -------------------------------------------------------------------------
  // transactionTypeRequired
  // -------------------------------------------------------------------------
  describe("transactionTypeRequired", () => {
    it("returns true for 'Income'", () => {
      const { transactionTypeRequired } = withSetup(() => useAppValidationRules());
      expect(transactionTypeRequired("Income")).toBe(true);
    });

    it("returns true for 'Expense'", () => {
      const { transactionTypeRequired } = withSetup(() => useAppValidationRules());
      expect(transactionTypeRequired("Expense")).toBe(true);
    });

    it("returns an error key for an empty string", () => {
      const { transactionTypeRequired } = withSetup(() => useAppValidationRules());
      expect(transactionTypeRequired("")).toBe("useApp.transReqd");
    });

    it("returns an error key for an invalid type", () => {
      const { transactionTypeRequired } = withSetup(() => useAppValidationRules());
      expect(transactionTypeRequired("Balance")).toBe("useApp.transReqd");
    });
  });

  // -------------------------------------------------------------------------
  // timeoutRules
  // -------------------------------------------------------------------------
  describe("timeoutRules", () => {
    it("returns true for 0", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(0)).toBe(true);
    });

    it("returns true for -1", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(-1)).toBe(true);
    });

    it("returns true for 10", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(10)).toBe(true);
    });

    it("returns true for 5", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(5)).toBe(true);
    });

    it("returns an error key for null", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(null)).toBe("useApp.reqd");
    });

    it("returns an error key for empty string", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules("")).toBe("useApp.reqd");
    });

    it("returns an error key for -2 (below minimum)", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(-2)).toBe("useApp.timeoutMin");
    });

    it("returns an error key for 11 (above maximum)", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(11)).toBe("useApp.timeoutMax");
    });

    it("returns an error key for a non-integer", () => {
      const { timeoutRules } = withSetup(() => useAppValidationRules());
      expect(timeoutRules(2.5)).toBe("useApp.timeoutInteger");
    });
  });

  // -------------------------------------------------------------------------
  // amountRules
  // -------------------------------------------------------------------------
  describe("amountRules", () => {
    it("returns true for a valid positive amount", () => {
      const { amountRules } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useAppValidationRules();
      });
      expect(amountRules("100.50")).toBe(true);
    });

    it("returns an error key for empty value", () => {
      const { amountRules } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useAppValidationRules();
      });
      expect(amountRules("")).toBe("useApp.reqdZeroOk");
    });

    it("returns an error key for zero", () => {
      const { amountRules } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useAppValidationRules();
      });
      expect(amountRules("0")).toBe("useApp.greater");
    });

    it("returns an error key for a negative amount", () => {
      const { amountRules } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useAppValidationRules();
      });
      expect(amountRules("-10")).toBe("useApp.greater");
    });

    it("returns a wrong separator error for en-US when comma used as decimal", () => {
      const { amountRules } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useAppValidationRules();
      });
      const result = amountRules("100,50");
      expect(result).toContain("useApp.wrongSeparator");
    });

    it("returns true for a valid de-DE amount with comma decimal", () => {
      const { amountRules } = withSetup(() => {
        useSettingsStore().locale = "de-DE";
        return useAppValidationRules();
      });
      expect(amountRules("100,50")).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // dateRules
  // -------------------------------------------------------------------------
  describe("dateRules", () => {
    const CURRENT_YEAR = new Date().getFullYear();

    beforeEach(() => {
      // Fix time to a known date in the current year for deterministic tests
      vi.useFakeTimers();
      vi.setSystemTime(new Date(CURRENT_YEAR, 5, 15)); // June 15 of current year
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns true for today's date", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules(`${CURRENT_YEAR}-06-15`)).toBe(true);
    });

    it("returns true for an earlier date in the current year", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules(`${CURRENT_YEAR}-01-01`)).toBe(true);
    });

    it("returns an error key for an empty string", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules("")).toBe("useApp.dateReqd");
    });

    it("returns an error key for a whitespace-only string", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules("   ")).toBe("useApp.dateReqd");
    });

    it("returns an error key for an invalid date format", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules("not-a-date")).toBe("useApp.invalidFmt");
    });

    it("returns an error key for a rolled-over date like Feb 31", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules(`${CURRENT_YEAR}-02-31`)).toBe("useApp.invalidFmt");
    });

    it("returns an error key for a future date", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules(`${CURRENT_YEAR}-06-16`)).toBe("useApp.notFuture");
    });

    it("returns an error key for a date in the previous year", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules(`${CURRENT_YEAR - 1}-12-31`)).toContain("useApp.notPrevYear");
    });

    it("returns an error key for a date in the next year", () => {
      const { dateRules } = withSetup(() => useAppValidationRules());
      expect(dateRules(`${CURRENT_YEAR + 1}-01-01`)).toBe("useApp.notFuture");
    });
  });
});
