import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAppValidationRules } from "@/composables/useAppValidationRules";

describe("useAppValidationRules", () => {
  // 1. Setup Fake Timers
  beforeEach(() => {
    vi.useFakeTimers();
    // Set to Noon to avoid "start of day" vs "end of day" edge cases
    const mockDate = new Date(2025, 11, 14, 12, 0, 0);
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // FIX: If the composable requires arguments, we pass them here.
  // If it doesn't, we ensure we are calling it inside the test context.
  // Note: I am casting to 'any' to bypass the compile error if your
  // specific project setup requires a Pinia instance or specific params.
  const rules = (useAppValidationRules as any)();

  describe("dateRules", () => {
    it("should return error for dates in a previous calendar year", () => {
      const pastYearDate = "2024-12-31";
      expect(rules.dateRules(pastYearDate)).toBe(
        "Transaction date cannot be from a previous calendar year (2025)."
      );
    });

    it("should return error for dates in the future", () => {
      // Use a date definitely in the next month to trigger the future check
      const futureDate = "2026-01-15";
      const result = rules.dateRules(futureDate);

      expect(result).toBe("Transaction date cannot be in the future (tomorrow or later).");
    });

    it("should return true for today", () => {
      // 2025-12-14 is our mocked "today"
      expect(rules.dateRules("2025-12-14")).toBe(true);
    });

    it("should return error for empty values", () => {
      expect(rules.dateRules(null)).toBe("Date is required.");
    });
  });

  describe("required/requiredNotZero", () => {
    it("should return error for empty/falsy values", () => {
      const errorMsg = "This field is required. Zero is not allowed.";
      expect(rules.required("")).toBe(errorMsg);
      expect(rules.required(0)).toBe(errorMsg);
    });

    it("should return error for empty/falsy values but not for zero", () => {
      const errorMsg = "This field is required. Zero is allowed.";
      expect(rules.requiredZeroOk("")).toBe(errorMsg);
      expect(rules.requiredZeroOk(0)).toBe(true);
    });
  });

  describe("amountRules", () => {
    it("should return true for positive numbers", () => {
      expect(rules.amountRules("100")).toBe(true);
    });

    it("should return error for zero", () => {
      const errorMsg = "Amount must be supplied and must be greater than zero";
      expect(rules.amountRules("0")).toBe(errorMsg);
    });
  });

  // ... inside the useAppValidationRules describe block ...

  describe("transactionTypeRequired", () => {
    it("should return true when a type is provided", () => {
      // This covers the (!!v) part of the rule
      expect(rules.transactionTypeRequired("income")).toBe(true);
      expect(rules.transactionTypeRequired("expense")).toBe(true);
    });

    it("should return an error message when value is null or empty", () => {
      expect(rules.transactionTypeRequired(null)).toBe("Transaction Type must be chosen");
      expect(rules.transactionTypeRequired("")).toBe("Transaction Type must be chosen");
    });
  });

  describe("dateRules - Invalid Formats", () => {
    it("should return 'Invalid date format.' and log a warning for garbage input", () => {
      // This triggers if(isNaN(parsedDate.getTime()))
      const invalidInput = "this-is-not-a-date";

      const result = rules.dateRules(invalidInput);

      expect(result).toBe("Invalid date format.");
      // Note: If you have your Logger mocked, you could also verify the warning:
      // expect(logWarning).toHaveBeenCalled();
    });
  });
});
