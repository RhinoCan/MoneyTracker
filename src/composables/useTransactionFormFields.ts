import { ref, computed, nextTick } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";
import { parseCurrency } from "@/utils/currencyParser";
import { TransactionTypeValues, type NewTransaction } from "@/types/Transaction";
import { useSettingsStore } from "@/stores/SettingsStore";
import { logException } from "@/lib/Logger";

export function useTransactionFormFields() {
  const settingsStore = useSettingsStore();
  const { formatCurrency } = useCurrencyFormatter();

  const { formatToMediumDate, formatToIsoDateOnly } = useDateFormatter();
  const { hasCorrectSeparator } = useNumberFormatHints();

  /**
   * getInitialTransactionState
   * Internal helper to ensure the data model starts with a clean, honest state.
   */
  const getInitialTransactionState = (): NewTransaction => ({
    amount: 0,
    transaction_type: TransactionTypeValues.Expense,
    date: formatToIsoDateOnly(new Date()),
    description: "",
  });

  // --- Data Model State ---
  const transaction = ref<NewTransaction>(getInitialTransactionState());

  // --- Display & UI State ---
  const displayAmount = ref("");
  const isFocused = ref(false);
  const dateMenu = ref(false);

  // --- Computed Properties ---

  const formattedAmount = computed<string>(() => {
    if (isFocused.value) return displayAmount.value;
    return formatCurrency(transaction.value.amount);
  });

  const formattedDate = computed<string>(() => {
    return transaction.value.date ? formatToMediumDate(transaction.value.date) : "";
  });

  const colorClass = computed<string>(() => {
    if (isFocused.value) return "money-neutral";
    const type = transaction.value.transaction_type;
    return type === TransactionTypeValues.Expense ? "money-minus" : "money-plus";
  });

  // --- Functions ---

  function resetForm() {
    const initialState = getInitialTransactionState();

    transaction.value.amount = initialState.amount;
    transaction.value.transaction_type = initialState.transaction_type;
    transaction.value.date = initialState.date;
    transaction.value.description = initialState.description;

    displayAmount.value = "";
    isFocused.value = false;
    dateMenu.value = false;
  }

  function handleFocus() {
    isFocused.value = true;
    const currentAmount = transaction.value.amount ?? 0;

    if (currentAmount > 0) {
      // Logic: Extract parts using the user's locale to avoid destructive character replacement
      const parts = new Intl.NumberFormat(settingsStore.locale).formatToParts(currentAmount);
      displayAmount.value = parts
        .filter((p) => ["integer", "decimal", "fraction"].includes(p.type))
        .map((p) => p.value)
        .join("");
    }
  }

  function handleBlur() {
    isFocused.value = false;
    const rawValue = displayAmount.value;
    const locale = settingsStore.locale;

    // 1. Validate separator before attempting parse
    if (!hasCorrectSeparator(rawValue)) {
      transaction.value.amount = 0;
      displayAmount.value = "";
      return;
    }

    // 2. Parse the locale-specific string back to a numeric value
    const parsedAmount = parseCurrency(rawValue, locale);

    if (parsedAmount !== null && parsedAmount > 0) {
      transaction.value.amount = parsedAmount;
      displayAmount.value = formatCurrency(parsedAmount);
    } else {
      transaction.value.amount = 0;

      // Log only if it wasn't an intentional empty/zero entry
      if (rawValue !== "" && rawValue !== "0") {
        logException(new Error("Currency Parsing Failed in Form"), {
          slug: "useTrans.parseError",
          module: "useTransactionFormFields",
          action: "handleBlur",
          data: { rawValue, locale },
        });
      }

      displayAmount.value = "";
    }
  }

  function closeDatePicker() {
    nextTick(() => {
      dateMenu.value = false;
    });
  }

  return {
    transaction,
    formattedAmount,
    formattedDate,
    resetForm,
    displayAmount,
    isFocused,
    colorClass,
    handleFocus,
    handleBlur,
    dateMenu,
    closeDatePicker,
  };
}
