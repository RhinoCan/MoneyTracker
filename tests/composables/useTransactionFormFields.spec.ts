// tests/composables/useTransactionFormFields.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref } from "vue";

// -------------------------------------------------------------------------
// Mock all composable dependencies before importing the target
// -------------------------------------------------------------------------
const mockFormatCurrency = vi.fn((amount: number) => `$${amount}`);
const mockFormatToMediumDate = vi.fn((date: string) => date ? `formatted:${date}` : "");
const mockFormatToIsoDateOnly = vi.fn(() => "2025-06-15");
const mockHasCorrectSeparator = vi.fn(() => true);

vi.mock("@/composables/useCurrencyFormatter", () => ({
  useCurrencyFormatter: () => ({ formatCurrency: mockFormatCurrency }),
}));

vi.mock("@/composables/useDateFormatter", () => ({
  useDateFormatter: () => ({
    formatToMediumDate: mockFormatToMediumDate,
    formatToIsoDateOnly: mockFormatToIsoDateOnly,
  }),
}));

vi.mock("@/composables/useNumberFormatHints", () => ({
  useNumberFormatHints: () => ({
    hasCorrectSeparator: mockHasCorrectSeparator,
    decimalSeparator: ref("."),
  }),
}));

vi.mock("@/stores/SettingsStore", () => ({
  useSettingsStore: () => ({ locale: "en-US", currency: "USD" }),
}));

vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
      t: (key: string) => key,
      te: () => false,
    },
  },
}));

// Import AFTER mocks are set up
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";

describe("useTransactionFormFields", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockFormatToIsoDateOnly.mockReturnValue("2025-06-15");
    mockFormatToMediumDate.mockImplementation((date: string) => date ? `formatted:${date}` : "");
    mockHasCorrectSeparator.mockReturnValue(true);
    mockFormatCurrency.mockImplementation((amount: number) => `$${amount}`);
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("transaction amount starts at 0", () => {
      const { transaction } = useTransactionFormFields();
      expect(transaction.value.amount).toBe(0);
    });

    it("transaction type starts as Expense", () => {
      const { transaction } = useTransactionFormFields();
      expect(transaction.value.transaction_type).toBe("Expense");
    });

    it("transaction description starts as empty string", () => {
      const { transaction } = useTransactionFormFields();
      expect(transaction.value.description).toBe("");
    });

    it("transaction date starts as today in YYYY-MM-DD format", () => {
      const { transaction } = useTransactionFormFields();
      expect(transaction.value.date).toBe("2025-06-15");
    });

    it("displayAmount starts as empty string", () => {
      const { displayAmount } = useTransactionFormFields();
      expect(displayAmount.value).toBe("");
    });

    it("isFocused starts as false", () => {
      const { isFocused } = useTransactionFormFields();
      expect(isFocused.value).toBe(false);
    });

    it("dateMenu starts as false", () => {
      const { dateMenu } = useTransactionFormFields();
      expect(dateMenu.value).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // colorClass computed
  // -------------------------------------------------------------------------
  describe("colorClass", () => {
    it("is 'money-minus' for Expense when not focused", () => {
      const { transaction, colorClass } = useTransactionFormFields();
      transaction.value.transaction_type = "Expense";
      expect(colorClass.value).toBe("money-minus");
    });

    it("is 'money-plus' for Income when not focused", () => {
      const { transaction, colorClass } = useTransactionFormFields();
      transaction.value.transaction_type = "Income";
      expect(colorClass.value).toBe("money-plus");
    });

    it("is 'money-neutral' when focused", () => {
      const { isFocused, colorClass } = useTransactionFormFields();
      isFocused.value = true;
      expect(colorClass.value).toBe("money-neutral");
    });
  });

  // -------------------------------------------------------------------------
  // resetForm
  // -------------------------------------------------------------------------
  describe("resetForm", () => {
    it("resets amount to 0", () => {
      const { transaction, resetForm } = useTransactionFormFields();
      transaction.value.amount = 500;
      resetForm();
      expect(transaction.value.amount).toBe(0);
    });

    it("resets transaction_type to Expense", () => {
      const { transaction, resetForm } = useTransactionFormFields();
      transaction.value.transaction_type = "Income";
      resetForm();
      expect(transaction.value.transaction_type).toBe("Expense");
    });

    it("resets description to empty string", () => {
      const { transaction, resetForm } = useTransactionFormFields();
      transaction.value.description = "Test";
      resetForm();
      expect(transaction.value.description).toBe("");
    });

    it("resets displayAmount to empty string", () => {
      const { displayAmount, resetForm } = useTransactionFormFields();
      displayAmount.value = "$100.00";
      resetForm();
      expect(displayAmount.value).toBe("");
    });

    it("resets isFocused to false", () => {
      const { isFocused, resetForm } = useTransactionFormFields();
      isFocused.value = true;
      resetForm();
      expect(isFocused.value).toBe(false);
    });

    it("resets dateMenu to false", () => {
      const { dateMenu, resetForm } = useTransactionFormFields();
      dateMenu.value = true;
      resetForm();
      expect(dateMenu.value).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleFocus
  // -------------------------------------------------------------------------
  describe("handleFocus", () => {
    it("sets isFocused to true", () => {
      const { isFocused, handleFocus } = useTransactionFormFields();
      handleFocus();
      expect(isFocused.value).toBe(true);
    });

    it("leaves displayAmount empty when amount is 0", () => {
      const { transaction, displayAmount, handleFocus } = useTransactionFormFields();
      transaction.value.amount = 0;
      handleFocus();
      expect(displayAmount.value).toBe("");
    });

    it("sets displayAmount to numeric digits when amount is positive", () => {
      const { transaction, displayAmount, handleFocus } = useTransactionFormFields();
      transaction.value.amount = 1234.56;
      handleFocus();
      expect(displayAmount.value).toBe("1234.56");
    });
  });

  // -------------------------------------------------------------------------
  // handleBlur
  // -------------------------------------------------------------------------
  describe("handleBlur", () => {
    it("sets isFocused to false", () => {
      const { isFocused, handleBlur } = useTransactionFormFields();
      isFocused.value = true;
      handleBlur();
      expect(isFocused.value).toBe(false);
    });

    it("parses a valid amount and stores it", () => {
      const { transaction, displayAmount, handleBlur } = useTransactionFormFields();
      displayAmount.value = "123.45";
      handleBlur();
      expect(transaction.value.amount).toBe(123.45);
    });

    it("resets amount to 0 for an empty displayAmount", () => {
      const { transaction, displayAmount, handleBlur } = useTransactionFormFields();
      displayAmount.value = "";
      handleBlur();
      expect(transaction.value.amount).toBe(0);
    });

    it("resets amount to 0 for an unparseable value", () => {
      const { transaction, displayAmount, handleBlur } = useTransactionFormFields();
      displayAmount.value = "abc";
      handleBlur();
      expect(transaction.value.amount).toBe(0);
    });

    it("resets amount to 0 when wrong decimal separator is used", () => {
      mockHasCorrectSeparator.mockReturnValue(false);
      const { transaction, displayAmount, handleBlur } = useTransactionFormFields();
      displayAmount.value = "100,50";
      handleBlur();
      expect(transaction.value.amount).toBe(0);
      expect(displayAmount.value).toBe("");
    });
  });

  // -------------------------------------------------------------------------
  // formattedDate computed
  // -------------------------------------------------------------------------
  describe("formattedDate", () => {
    it("returns empty string when date is empty", () => {
      const { transaction, formattedDate } = useTransactionFormFields();
      transaction.value.date = "";
      expect(formattedDate.value).toBe("");
    });

    it("calls formatToMediumDate with the current date", () => {
      const { transaction, formattedDate } = useTransactionFormFields();
      transaction.value.date = "2025-06-15";
      const _ = formattedDate.value;
      expect(mockFormatToMediumDate).toHaveBeenCalledWith("2025-06-15");
    });
  });
});
