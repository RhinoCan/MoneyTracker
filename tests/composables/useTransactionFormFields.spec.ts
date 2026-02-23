import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";
import { useLocaleStore } from "@/stores/LocaleStore";
import { parseCurrency } from "@/utils/currencyParser";
import { logException } from "@/utils/Logger";
import { TransactionTypeValues } from "@/types/Transaction";

// 1. Mock all dependencies
vi.mock("@/composables/useCurrencyFormatter", () => ({
  useCurrencyFormatter: () => ({ displayMoney: vi.fn((val) => `$${val}`) }),
}));

vi.mock("@/composables/useDateFormatter", () => ({
  useDateFormatter: () => ({ formatDate: vi.fn((val) => "2025-01-01") }),
}));

vi.mock("@/composables/useAppValidationRules", () => ({
  useAppValidationRules: () => ({
    required: vi.fn(() => true),
    dateRules: vi.fn(() => true),
    amountRules: vi.fn((v) => (v === "invalid" ? "Error" : true)),
  }),
}));

vi.mock("@/utils/currencyParser", () => ({
  parseCurrency: vi.fn(),
}));

vi.mock("@/utils/Logger", () => ({
  logException: vi.fn(),
}));

vi.mock("@/stores/LocaleStore", () => ({
  useLocaleStore: () => ({ currentLocale: "en-US" }),
}));

describe("useTransactionFormFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values if no external ref is provided", () => {
    const { transaction } = useTransactionFormFields();
    expect(transaction.value).not.toBeNull();
    expect(transaction.value?.amount).toBe(0);
  });

  it("should use the external transaction ref if provided", () => {
    const external = ref({
      id: 99,
      amount: 50,
      transactionType: TransactionTypeValues.Income,
      date: "",
      description: "",
    });
    const { transaction } = useTransactionFormFields(external as any);
    expect(transaction.value?.id).toBe(99);
  });

  describe("Formatting and Focus Logic", () => {
    it("should toggle between raw amount and formatted amount on focus/blur", () => {
      const { formattedAmount, handleFocus, handleBlur, displayAmount, transaction } =
        useTransactionFormFields();

      // 1. Setup the mock to return a number when called
      (parseCurrency as any).mockReturnValue(123.45);

      transaction.value!.amount = 123.45;

      // On Focus: should show the raw number string
      handleFocus();
      expect(displayAmount.value).toBe("123.45");
      expect(formattedAmount.value).toBe("123.45");

      // On Blur:
      // This will call parseCurrency("123.45"), which now returns 123.45
      handleBlur();

      expect(transaction.value?.amount).toBe(123.45);
      expect(formattedAmount.value).toBe("$123.45");
    });

    it("should set displayAmount to empty string if transaction amount is null on focus", () => {
      const { handleFocus, displayAmount, transaction } = useTransactionFormFields();

      // Set the amount to null explicitly to trigger the 'else' branch
      transaction.value!.amount = null as any;

      handleFocus();

      expect(displayAmount.value).toBe("");
    });

    it("should return empty string for formattedDate if transaction has no date", () => {
      const { transaction, formattedDate } = useTransactionFormFields();
      transaction.value = null;
      expect(formattedDate.value).toBe("");
    });

    it("should format the date when a date value exists", () => {
      const { transaction, formattedDate } = useTransactionFormFields();

      // Ensure transaction exists and has a date string
      transaction.value = {
        id: 1,
        amount: 10,
        transactionType: TransactionTypeValues.Expense,
        date: "2025-01-01T00:00:00.000Z",
        description: "Test",
      };

      // This triggers the 'formatDate(dateValue)' part of the ternary
      expect(formattedDate.value).toBe("2025-01-01");
    });
  });

  describe("handleBlur and Parsing", () => {
    it("should update transaction amount on successful parse", () => {
      const { displayAmount, handleBlur, transaction } = useTransactionFormFields();
      (parseCurrency as any).mockReturnValue(500);

      displayAmount.value = "500";
      handleBlur();

      expect(transaction.value?.amount).toBe(500);
    });

    it("should log exception on parse/validator mismatch (Line 113)", () => {
      const { displayAmount, handleBlur } = useTransactionFormFields();

      // Simulator: Validator says it's fine, but parser returns null
      (parseCurrency as any).mockReturnValue(null);
      displayAmount.value = "something-weird";

      handleBlur();

      expect(logException).toHaveBeenCalled();
    });
  });

  it("should reset the form to defaults", () => {
    const { resetForm, transaction, displayAmount } = useTransactionFormFields();
    transaction.value!.amount = 100;
    displayAmount.value = "100";

    resetForm();

    expect(transaction.value?.amount).toBe(0);
    expect(displayAmount.value).toBe("");
  });

  it("should close the date picker on nextTick", async () => {
    const { dateMenu, closeDatePicker } = useTransactionFormFields();
    dateMenu.value = true;
    closeDatePicker();
    await nextTick();
    expect(dateMenu.value).toBe(false);
  });

  describe("Color Classes", () => {
    it("should return money-neutral when focused", () => {
      const { colorClass, handleFocus } = useTransactionFormFields();
      handleFocus();
      expect(colorClass.value).toBe("money-neutral");
    });

    it("should return money-plus for income and money-minus for expense", () => {
      const { transaction, colorClass, isFocused } = useTransactionFormFields();
      isFocused.value = false;

      transaction.value!.transactionType = TransactionTypeValues.Income;
      expect(colorClass.value).toBe("money-plus");

      transaction.value!.transactionType = TransactionTypeValues.Expense;
      expect(colorClass.value).toBe("money-minus");
    });
  });

  describe("Null Transaction Edge Cases", () => {
    it("should handle null transaction in formattedAmount and formattedDate", () => {
      const { transaction, formattedAmount, formattedDate, isFocused } = useTransactionFormFields();

      // 1. Force transaction to null
      transaction.value = null;
      isFocused.value = false;

      // This hits: return displayMoney(transaction.value?.amount ?? 0);
      // It should pass 0 to displayMoney because of the ?? 0
      expect(formattedAmount.value).toBe("$0");

      // This hits: const dateValue = transaction.value?.date; return dateValue ? ... : "";
      expect(formattedDate.value).toBe("");
    });

    it("should return early in resetForm if transaction is null", () => {
      const { transaction, resetForm, displayAmount } = useTransactionFormFields();

      // 1. Set a value that reset would normally clear
      displayAmount.value = "Keep Me";
      transaction.value = null;

      // 2. This hits: if (!transaction.value) return;
      resetForm();

      // 3. Verify it returned early and didn't clear displayAmount
      expect(displayAmount.value).toBe("Keep Me");
    });
  });

  describe("Validation Rules Object", () => {
    it("should execute the wrapper functions in the rules object", () => {
      const { rules } = useTransactionFormFields();

      // Execute the date wrapper
      // This calls (v: string | null) => dateRules(v)
      expect(rules.date[1]("2025-01-01")).toBe(true);

      // Execute the amount wrapper
      // This calls (v: string) => amountRules(v)
      expect(rules.amount[1]("100")).toBe(true);

      // Note: rules.category[0] is just the 'required' function itself,
      // which is already counted, but calling these two wrappers
      // will clear the 'untested function' flags.
    });
  });
});
