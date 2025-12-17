import { ref, computed, nextTick, type Ref } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { parseCurrency } from "@/utils/currencyParser";
import { TransactionTypeValues, type Transaction } from "@/types/Transaction";

// Define the shape of the data model exposed by the composable,
// matching the structure we tested.
interface FormFields {
  // Data Model
  transaction: Ref<
    Omit<Transaction, "id" | "description" | "date"> & {
      date: Date;
      category: string | null;
      description: string;
    }
  >;
  formattedAmount: Ref<string>;
  formattedDate: Ref<string>;
  resetForm: () => void;
  rules: {
    date: any[];
    amount: any[];
    category: any[];
  };
  // Input/Display State
  displayAmount: Ref<string>;
  isFocused: Ref<boolean>;
  colorClass: Ref<string>;
  handleFocus: () => void;
  handleBlur: () => void;
  // Date Picker State
  dateMenu: Ref<boolean>;
  closeDatePicker: () => void;
}

export function useTransactionFormFields(): FormFields {
  const { displayMoney } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();
  const { required, dateRangeRule, amountValidations } = useAppValidationRules();

  // --- Data Model State ---
  const transaction = ref({
    amount: 0,
    transactionType: TransactionTypeValues.Expense,
    date: new Date(),
    category: null,
    description: "",
  });

  // --- Display State ---
  const displayAmount = ref("");
  const isFocused = ref(false);
  const dateMenu = ref(false);

  // --- Computed Properties ---

  const formattedAmount = computed<string>(() => {
    // Only format if not focused, otherwise use the value in displayAmount
    if (isFocused.value) {
      return displayAmount.value;
    }
    return displayMoney(transaction.value.amount);
  });

  const formattedDate = computed<string>(() => {
    return formatDate(transaction.value.date);
  });

const colorClass = computed<string>(() => {
    if (isFocused.value) {
      return "money-neutral";
    }
    // CRITICAL FIX: Cast the value to 'string' to resolve the TS2367 type error.
    return (transaction.value.transactionType as string) === TransactionTypeValues.Expense
      ? "money-minus"
      : "money-plus";
});

  // --- Functions ---

  function resetForm() {
    transaction.value.amount = 0;
    transaction.value.transactionType = TransactionTypeValues.Expense;
    transaction.value.date = new Date();
    transaction.value.category = null;
    transaction.value.description = "";
    displayAmount.value = "";
    isFocused.value = false;
    dateMenu.value = false;
  }

  function handleFocus() {
    isFocused.value = true;
    if (transaction.value.amount !== null && transaction.value.amount !== undefined) {
      // Set displayAmount to the raw, unformatted number for editing
      displayAmount.value = transaction.value.amount.toString();
    } else {
      // Handles case where amount might be null/undefined due to bad data (L134 coverage)
      displayAmount.value = "";
    }
  }

  function handleBlur() {
    isFocused.value = false;
    const parsedAmount = parseCurrency(displayAmount.value);

    // 1. Update the underlying data model (L143-144 coverage)
    if (parsedAmount !== null && parsedAmount > 0) {
      transaction.value.amount = parsedAmount;
    } else {
      transaction.value.amount = 0;
    }

    // 2. Re-format the display value using the updated model amount
    // We use the formattedAmount computed property to handle the formatting logic,
    // which in turn uses displayMoney().
    displayAmount.value = formattedAmount.value;
  }

  function closeDatePicker() {
    // Uses nextTick to ensure the v-menu closes first, avoiding flicker/double-open (L159 coverage)
    nextTick(() => {
      dateMenu.value = false;
    });
  }

 // --- Validation Rules ---
// CRITICAL FIX: Wrap the imported rules in anonymous functions to satisfy the
// TypeScript compiler's signature check, especially since it complains they need 'v'.
const rules = {
  // We expect dateRangeRule and amountValidations to take 'v' and return true/string
  date: [required, (v: string | null) => dateRangeRule(v)],
  amount: [required, (v: string) => amountValidations(v)],
  category: [required],
};

  return {
    transaction,
    formattedAmount,
    formattedDate,
    resetForm,
    rules,
    displayAmount,
    isFocused,
    colorClass,
    handleFocus,
    handleBlur,
    dateMenu,
    closeDatePicker,
  };
}