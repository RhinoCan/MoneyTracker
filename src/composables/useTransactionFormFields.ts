import { ref, computed, nextTick, type Ref } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { parseCurrency } from "@/utils/currencyParser";
import { TransactionTypeValues, type Transaction } from "@/types/Transaction";
import { useLocaleStore } from "@/stores/LocaleStore"
import { logException } from "@/utils/Logger";

// Updated the interface to acknowledge the transaction can be null
interface FormFields {
  transaction: Ref<Transaction | null>;
  formattedAmount: Ref<string>;
  formattedDate: Ref<string>;
  resetForm: () => void;
  rules: {
    date: any[];
    amount: any[];
    category: any[];
  };
  displayAmount: Ref<string>;
  isFocused: Ref<boolean>;
  colorClass: Ref<string>;
  handleFocus: () => void;
  handleBlur: () => void;
  dateMenu: Ref<boolean>;
  closeDatePicker: () => void;
}

export function useTransactionFormFields(externalTransaction?: Ref<Transaction | null>): FormFields {
  const localeStore = useLocaleStore();
  const { displayMoney } = useCurrencyFormatter();
  const { formatDate } = useDateFormatter();
  const { required, dateRangeRule, amountValidations } = useAppValidationRules(localeStore.currentLocale);

  // --- Data Model State ---
  // If an external Ref is provided, use it. Otherwise, create a default internal one.
  const internalTransaction = ref<Transaction>({
    id: 0,
    amount: 0,
    transactionType: TransactionTypeValues.Expense,
    date: new Date().toISOString(),
    description: "",
  });

  const transaction = (externalTransaction || internalTransaction) as Ref<Transaction | null>;

  // --- Display State ---
  const displayAmount = ref("");
  const isFocused = ref(false);
  const dateMenu = ref(false);

  // --- Computed Properties ---

  const formattedAmount = computed<string>(() => {
    if (isFocused.value) {
      return displayAmount.value;
    }
    // Added optional chaining ?.
    return displayMoney(transaction.value?.amount ?? 0);
  });

  const formattedDate = computed<string>(() => {
    // Added optional chaining ?.
    const dateValue = transaction.value?.date;
    return dateValue ? formatDate(dateValue) : "";
  });

  const colorClass = computed<string>(() => {
    if (isFocused.value) {
      return "money-neutral";
    }
    // Added optional chaining and fallback
    const type = transaction.value?.transactionType;
    return (type as string) === TransactionTypeValues.Expense
      ? "money-minus"
      : "money-plus";
  });

  // --- Functions ---

  function resetForm() {
    if (!transaction.value) return;

    transaction.value.amount = 0;
    transaction.value.transactionType = TransactionTypeValues.Expense;
    transaction.value.date = new Date().toISOString();
    transaction.value.description = "";
    displayAmount.value = "";
    isFocused.value = false;
    dateMenu.value = false;
  }

  function handleFocus() {
    isFocused.value = true;
    const currentAmount = transaction.value?.amount;
    if (currentAmount !== null && currentAmount !== undefined) {
      displayAmount.value = currentAmount.toString();
    } else {
      displayAmount.value = "";
    }
  }

  function handleBlur() {
    isFocused.value = false;
    const rawValue = displayAmount.value;
    const parsedAmount = parseCurrency(rawValue, localeStore.currentLocale);
    //const localeStore = useLocaleStore();
    const validationResult = amountValidations(rawValue);
    const isValidAccordingToRules = validationResult === true;

    if (transaction.value) {
      if (parsedAmount !== null && parsedAmount > 0) {
        transaction.value.amount = parsedAmount;
      } else {
        transaction.value.amount = 0;
        if (isValidAccordingToRules && rawValue !== "" && rawValue !== "0") {
          logException(new Error("Parse/Validator Mismatch"), {
            module: "useTransactionFormFields", action: "handleBlur", data: {rawValue, locale: localeStore.currentLocale }
          })
        }
      }
    }

    displayAmount.value = formattedAmount.value;
  }

  function closeDatePicker() {
    nextTick(() => {
      dateMenu.value = false;
    });
  }

  // --- Validation Rules ---
  const rules = {
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