<script lang="ts" setup>
import { ref, computed, nextTick } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";
import { TransactionTypeValues } from "@/types/Transaction";
import type { SubmitEventPromise } from "vuetify";
import KeyboardShortcuts from "@/components/KeyboardShortcuts.vue";
import { logSuccess, logValidation, logException } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const transactionStore = useTransactionStore();
const { formatToMediumDate, formatToIsoDateOnly } = useDateFormatter();
const { required, transactionTypeRequired, dateRules, amountRules } = useAppValidationRules();
const { amountExample, hasCorrectSeparator, decimalSeparator } = useNumberFormatHints();

const showKeyboardShortcuts = ref(false);
const newTransactionForm = ref();
const dateError = ref<string | null>(null);

// Pull logic from the shared form composable
const { transaction, displayAmount, isFocused, colorClass, handleFocus, handleBlur } =
  useTransactionFormFields();

// Date picker needs a Date object
const pickerDate = ref<Date>(new Date());

// Amount format hint
const amountHint = computed(() => {
  if (!isFocused.value || !displayAmount.value) {
    return t("common.format", { example: amountExample.value });
  }

  if (!hasCorrectSeparator(displayAmount.value)) {
    return t("common.wrongSeparator", { separator: decimalSeparator.value });
  }

  return t("common.format", { example: amountExample.value });
});

// Rules object for the template
const rules = {
  required,
  dateRequired: () => dateRules(transaction.value?.date || ""),
  transactionTypeRequired,
  amountRules,
};

// Handle date selection from picker
function onDateSelected(date: Date | Date[] | null) {
  if (Array.isArray(date)) return;

  if (!date) {
    if (transaction.value) {
      transaction.value.date = "";
    }
    return;
  }

  if (transaction.value) {
    transaction.value.date = formatToIsoDateOnly(date);
    pickerDate.value = date;
  }
}

async function onSubmit(event: SubmitEventPromise) {
  handleBlur();
  dateError.value = null;

  const { valid } = await event;

  if (!valid || !transaction.value) {
    logValidation(t("common.invalidAmount"), {
      module: "AddTransaction",
      action: "onSubmit",
    });
    return;
  }

  try {
    const finalAmount = transaction.value.amount;
    if (!finalAmount || finalAmount <= 0) {
      logException(new Error("Validation failed: Amount is missing or negative."), {
        module: "AddTransaction",
        action: "onSubmit",
        slug: "addTrans.err_missing_or_negative",
      });
      return;
    }

    const newTransaction = {
      description: transaction.value.description,
      date: transaction.value.date,
      transaction_type: transaction.value.transaction_type,
      amount: finalAmount,
    };

    await transactionStore.addTransaction(newTransaction);

    logSuccess(t("addTrans.success"), {
      module: "AddTransaction",
      action: "onSubmit",
    });

    resetForm();
  } catch (error) {
    logException(error, {
      module: "AddTransaction",
      action: "onSubmit",
      slug: "addTrans.submit_failed",
    });
  }
}

function resetForm() {
  const today = new Date();

  if (transaction.value) {
    transaction.value.description = "";
    transaction.value.amount = 0;
    transaction.value.date = formatToIsoDateOnly(today);
    transaction.value.transaction_type = TransactionTypeValues.Expense;
  }

  pickerDate.value = today;
  displayAmount.value = "";
  dateError.value = null;

  if (newTransactionForm.value) {
    nextTick(() => {
      newTransactionForm.value.resetValidation();
    });
  }
}
</script>

<template>
  <v-card elevation="8" color="surface" class="mx-auto">
    <v-card-title class="bg-primary text-on-primary d-flex align-center justify-space-between">
      {{ t("addTrans.title") }}
      <v-tooltip :text="t('common.help')">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            :aria-label="t('common.help')"
            icon="mdi-help"
            variant="text"
            size="small"
            @click="showKeyboardShortcuts = true"
          />
        </template>
      </v-tooltip>
    </v-card-title>

    <v-form
      ref="newTransactionForm"
      @submit.prevent="onSubmit"
      @keydown.esc="resetForm"
      class="pa-4"
    >
      <v-text-field
        data-testid="description-field"
        v-model="transaction!.description"
        :label="t('addTrans.labelDescription')"
        variant="outlined"
        :rules="[rules.required]"
      />

      <v-date-input
        v-model="pickerDate"
        :label="t('addTrans.labelDate')"
        variant="outlined"
        prepend-icon=""
        prepend-inner-icon="mdi-calendar"
        :rules="[rules.dateRequired]"
        :error-messages="dateError"
        color="primary"
        :display-format="(date: unknown) => formatToMediumDate(formatToIsoDateOnly(date as Date))"
        @update:model-value="onDateSelected"
      />

      <v-radio-group
        v-model="transaction!.transaction_type"
        inline
        :label="t('addTrans.labelType')"
        :rules="[rules.transactionTypeRequired]"
      >
        <v-radio
          data-testid="income-radio"
          :label="t('addTrans.labelIncome')"
          :value="TransactionTypeValues.Income"
          color="success"
        />
        <v-radio
          data-testid="expense-radio"
          :label="t('addTrans.labelExpense')"
          :value="TransactionTypeValues.Expense"
          color="error"
        />
      </v-radio-group>

      <v-text-field
        data-testid="amount-field"
        v-model="displayAmount"
        :label="t('addTrans.labelAmount')"
        :hint="amountHint"
        persistent-hint
        variant="outlined"
        :class="[isFocused ? '' : colorClass, 'money-field']"
        @focus="handleFocus"
        @blur="handleBlur"
        :rules="[rules.amountRules]"
      />

      <v-card-actions class="d-flex justify-end mt-4 flex-wrap gap-2">
        <v-btn data-testid="reset-btn" variant="outlined" color="secondary" @click="resetForm">
          {{ t("addTrans.btnReset") }}
        </v-btn>

        <v-btn type="submit" color="primary" data-testid="add-transaction-btn" elevation="4">
          {{ t("addTrans.btnAdd") }}
        </v-btn>
      </v-card-actions>
    </v-form>

    <v-dialog
      v-model="showKeyboardShortcuts"
      max-width="400"
      aria-labelledby="keyboard-shortcuts-dialog-title"
    >
      <KeyboardShortcuts v-if="showKeyboardShortcuts" @close="showKeyboardShortcuts = false" />
    </v-dialog>
  </v-card>
</template>

<style scoped>
.money-field :deep(.v-field__input) {
  font-size: 1.25rem !important;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.money-field.money-plus :deep(.v-field__input) {
  color: rgb(var(--v-theme-success)) !important;
}

.money-field.money-minus :deep(.v-field__input) {
  color: rgb(var(--v-theme-error)) !important;
}
</style>
