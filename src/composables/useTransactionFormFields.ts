// @/composables/useTransactionFormFields.ts
import { ref, computed, nextTick, type Ref } from "vue";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";
import { parseCurrency } from "@/utils/currencyParser";
import { TransactionTypeValues, type Transaction } from "@/types/Transaction";
import { useSettingsStore } from "@/stores/SettingsStore";
import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

const t = (i18n.global as any).t;

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

export function useTransactionFormFields(
  externalTransaction?: Ref<Transaction | null>,
): FormFields {
  const settingsStore = useSettingsStore();
  const { displayMoney } = useCurrencyFormatter();
  const { formatForUI, toISODateString } = useDateFormatter();
  const { required, dateRules, amountRules } = useAppValidationRules();
  const { hasCorrectSeparator } = useNumberFormatHints();

  // --- Data Model State ---
  const today = new Date();
  const internalTransaction = ref<Transaction>({
    id: 0,
    amount: 0,
    transaction_type: TransactionTypeValues.Expense,
    date: toISODateString(today),
    description: "",
    user_id: "",
  });

  const transaction = (externalTransaction ||
    internalTransaction) as Ref<Transaction | null>;

  // --- Display State ---
  const displayAmount = ref("");
  const isFocused = ref(false);
  const dateMenu = ref(false);

  // --- Computed Properties ---

  const formattedAmount = computed<string>(() => {
    if (isFocused.value) {
      return displayAmount.value;
    }
    return displayMoney.value(transaction.value?.amount ?? 0);
  });

  const formattedDate = computed<string>(() => {
    const dateValue = transaction.value?.date;
    return dateValue ? formatForUI(dateValue) : "";
  });

  const colorClass = computed<string>(() => {
    if (isFocused.value) return "money-neutral";
    const type = transaction.value?.transaction_type;
    return type === TransactionTypeValues.Expense ? "money-minus" : "money-plus";
  });

  // --- Functions ---

  function resetForm() {
    if (!transaction.value) return;
    const today = new Date();
    transaction.value.amount = 0;
    transaction.value.transaction_type = TransactionTypeValues.Expense;
    transaction.value.date = toISODateString(today);
    transaction.value.description = "";
    displayAmount.value = "";
    isFocused.value = false;
    dateMenu.value = false;
  }

  function handleFocus() {
    isFocused.value = true;
    const currentAmount = transaction.value?.amount;
    if (currentAmount !== null && currentAmount !== undefined && currentAmount > 0) {
      // Format using locale decimal separator so German users see 5,01 not 5.01
      const parts = new Intl.NumberFormat(settingsStore.locale).formatToParts(currentAmount);
      displayAmount.value = parts
        .filter(p => p.type === 'integer' || p.type === 'decimal' || p.type === 'fraction')
        .map(p => p.value)
        .join('');
    } else {
      //If amount is 0 (invalid input was rejected), leave displayAmount as-is
    }
  }

  function handleBlur() {
    isFocused.value = false;
    const rawValue = displayAmount.value;
    const locale = settingsStore.locale;

    // Reject immediately if wrong decimal separator used
    if (!hasCorrectSeparator(rawValue)) {
      transaction.value!.amount = 0;
      //Leave displayAmount as the invalid input so the user can see and correct it
      displayAmount.value =  rawValue;
      return;
    }

    // Parse the string into a clean number
    const parsedAmount = parseCurrency(rawValue, locale);

    // Check validation rules for mismatch logging
    const validationResult = amountRules(rawValue);
    const isValidAccordingToRules = validationResult === true;

    if (transaction.value) {
      if (parsedAmount !== null && parsedAmount > 0) {
        // SUCCESS: Update the numeric amount in our data model
        transaction.value.amount = parsedAmount;
        // Update the display field with the pretty formatted version
        displayAmount.value = displayMoney.value(parsedAmount);
      } else {
        // FAILURE: Reset model to 0
        transaction.value.amount = 0;

        // Log if the parser failed but the validator was happy (logic gap detection)
        if (isValidAccordingToRules && rawValue !== "" && rawValue !== "0") {
          logException(new Error("Parse/Validator Mismatch"), {
            slug: t("useTrans.parseValidatorMismatch"),
            module: "useTransactionFormFields",
            action: "handleBlur",
            data: { rawValue, locale },
          });
        }

        if (rawValue === "" || rawValue === "0") {
          displayAmount.value = displayMoney.value(0);
        }
      }
    }
  }

  function closeDatePicker() {
    nextTick(() => {
      dateMenu.value = false;
    });
  }

  const rules = {
    date: [required, (v: any) => dateRules(v)],
    amount: [required, (v: any) => amountRules(v)],
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