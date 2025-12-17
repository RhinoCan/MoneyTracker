// __tests__/composables/useAppValidationRules.spec.ts

import { describe, it, expect, vi } from "vitest";
import { useAppValidationRules } from "@/composables/useAppValidationRules";

// Mock the current date to ensure tests are stable.
// We are setting the virtual system time to Sunday, December 14, 2025.
vi.useFakeTimers();
vi.setSystemTime(new Date("2025-12-14T10:00:00Z"));

// Get the rules object from the composable
const { dateRangeRule } = useAppValidationRules();

describe("useAppValidationRules", () => {
  // --- Test for dateRangeRule ---
  describe("dateRangeRule", () => {
    // ... inside describe('dateRangeRule', () => { ...

    // Test 1: Date is in a previous calendar year (e.g., 2024)
    it("should return error for dates in a previous calendar year", () => {
      const pastYearDate = "2024-12-31";
      expect(dateRangeRule(pastYearDate)).toBe(
        "Transaction date cannot be from a previous calendar year (2025)."
      );
    });

    // Test 2: Date is in the current year but in the future
    it("should return error for dates in the future", () => {
      // Tomorrow's date (relative to the mocked 2025-12-14)
      const futureDate = "2025-12-15";
      expect(dateRangeRule(futureDate)).toBe(
        "Transaction date cannot be in the future (tomorrow or later)."
      );
    });

    // Test 3: Date is today (which is valid)
    it("should return true for the current date", () => {
      const today = "2025-12-14";
      expect(dateRangeRule(today)).toBe(true);
    });

    // Test 4: Date is in the current year and in the past (which is valid)
    it("should return true for a valid past date in the current year", () => {
      const validPastDate = "2025-01-01";
      expect(dateRangeRule(validPastDate)).toBe(true);
    });

    // Test 5: Handling a null/empty value (though 'required' should catch this first)
    it("should return an error for null/empty value", () => {
      expect(dateRangeRule(null)).toBe("Date is required.");
    });

    // ... end of describe('dateRangeRule', () => { ...
  });

  // __tests__/composables/useAppValidationRules.spec.ts

    describe('Basic Required Field Validation (required)', () => {

        test('should return true for valid string or number inputs', () => {
            const { required } = useAppValidationRules();
            expect(required('abc')).toBe(true);
            expect(required(100)).toBe(true);
        });

        test('should return error for falsy values (null, undefined, 0)', () => {
            const { required } = useAppValidationRules();
            const expectedError = 'This field is required.';

            // This case specifically hits the '!!v' check failure
            expect(required(null)).toBe(expectedError);
            expect(required(undefined)).toBe(expectedError);
            expect(required(0)).toBe(expectedError); // <-- Critical to test number 0

            // This case specifically hits the 'v !== ''' check failure
            expect(required('')).toBe(expectedError); // <-- Critical to test empty string
        });
    });

  describe('Transaction Type Validation (transactionTypeRequired)', () => {

        test('should pass validation if transaction type is provided', () => {
            const { transactionTypeRequired } = useAppValidationRules();

            // Valid inputs
            expect(transactionTypeRequired('income')).toBe(true);
            expect(transactionTypeRequired('expense')).toBe(true);
        });

        test('should fail validation if transaction type is null', () => {
            const { transactionTypeRequired } = useAppValidationRules();

            // Invalid input
            expect(transactionTypeRequired(null)).toBe('Transaction Type must be chosen');
        });
    });

    // __tests__/composables/useAppValidationRules.spec.ts

    describe('Amount Validation (amountValidations)', () => {

        test('should return true for valid, positive amounts', () => {
            const { amountValidations } = useAppValidationRules();
            expect(amountValidations('10.50')).toBe(true);
            expect(amountValidations(' 100 ')).toBe(true);
        });

        test('should return error for zero or negative amounts', () => {
            const { amountValidations } = useAppValidationRules();
            const expectedError = "Amount must be supplied and must be greater than zero";

            // Fails the 'parsedAmount > 0' check
            expect(amountValidations('0')).toBe(expectedError);
        });

        test('should return error for non-numeric or empty input (results in NaN or 0)', () => {
            const { amountValidations } = useAppValidationRules();
            const expectedError = "Amount must be supplied and must be greater than zero";

            // Fails because it scrubs to '' and parseFloat('') is NaN
            expect(amountValidations('')).toBe(expectedError);

            // Fails because scrubbing removes all non-numeric chars, resulting in NaN or 0
            expect(amountValidations('abc')).toBe(expectedError); // <-- Forces NaN path
            expect(amountValidations('$0.00')).toBe(expectedError);
        });
    });

  // You would add tests for other rules (required, amountValidations, etc.) here too
});

// IMPORTANT: After the tests, restore the real timers
vi.useRealTimers();
