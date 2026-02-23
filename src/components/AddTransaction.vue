<script lang="ts" setup>
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";
import { TransactionTypeValues } from "@/types/Transaction";
import type { SubmitEventPromise } from "vuetify";
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog.vue";
import { useSettingsStore } from "@/stores/SettingsStore";
import { logSuccess, logValidation, logException } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const settingsStore = useSettingsStore();
const storeTransaction = useTransactionStore();
const { formatForUI, toISODateString } = useDateFormatter();
const { required, transactionTypeRequired, dateRules, amountRules } = useAppValidationRules();
const { amountPlaceholder, amountExample, hasCorrectSeparator, decimalSeparator } = useNumberFormatHints();

const showKeyboardShortcuts = ref(false);
const newTransactionForm = ref();
const dateError = ref<string | null>(null);

// Pull logic from the shared form composable
const {
  transaction, // This holds description, date, amount, type
  displayAmount,
  isFocused,
  colorClass,
  handleFocus,
  handleBlur,
  dateMenu,
  closeDatePicker,
} = useTransactionFormFields();

// Date picker needs a Date object
const pickerDate = ref<Date>(new Date());

// Display date in localized format for the text field
const formattedDisplayDate = computed(() => {
  return transaction.value?.date ? formatForUI(transaction.value.date) : '';
});

// Amount format hint
const amountHint = computed(() => {
  if (!isFocused.value || !displayAmount.value) {
    return t('common.format', { example: amountExample.value });
  }

  if (!hasCorrectSeparator(displayAmount.value)) {
    return t('common.wrongSeparator', { separator: decimalSeparator.value });
  }

  return t('common.format', { example: amountExample.value });
});

// Rules object for the template
const rules = {
  required,
  dateRequired: (v: string) => dateRules(transaction.value?.date || ''),
  transactionTypeRequired,
  amountRules,
};

// Handle date selection from picker
function onDateSelected(date: Date | Date[] | null) {
  if (!date || Array.isArray(date)) return;

  // Update the source of truth (YYYY-MM-DD string)
  if (transaction.value) {
    transaction.value.date = toISODateString(date);
    pickerDate.value = date;
  }

  closeDatePicker();
}

async function onSubmit(event: SubmitEventPromise) {
  handleBlur();
  dateError.value = null;

  const { valid } = await event;

  if (!valid || !transaction.value) {
    logValidation(t('common.invalidAmount'), {
      module: "AddTransaction",
      action: "onSubmit",
    });
    return;
  }

  try {
    const finalAmount = transaction.value.amount;
    if (!finalAmount || finalAmount <= 0) {
      logException(new Error("Validation failed: Amount is missing or negative."), {
        module: 'AddTransaction',
        action: 'onSubmit',
        slug: t('addTrans.err_missing_or_negative')
      });
      return;
    }

    const newTransaction = {
      description: transaction.value.description,
      date: transaction.value.date,
      transaction_type: transaction.value.transaction_type,
      amount: finalAmount,
    };

    await storeTransaction.addTransaction(newTransaction);

    logSuccess(t('addTrans.success'), {
      module: 'AddTransaction',
      action: 'onSubmit'
    });

    resetForm();

    if (newTransactionForm.value) {
      newTransactionForm.value.resetValidation();
    }
  } catch (error) {
    logException(error, {
      module: 'AddTransaction',
      action: 'onSubmit',
      slug: t('addTrans.submit_failed')
    });
  }
}

function resetForm() {
  if (newTransactionForm.value) newTransactionForm.value.reset();

  const today = new Date();

  // Explicitly reset the composable's state
  if (transaction.value) {
    transaction.value.description = "";
    transaction.value.amount = 0;
    transaction.value.date = toISODateString(today); // YYYY-MM-DD format
    transaction.value.transaction_type = TransactionTypeValues.Expense;
  }

  pickerDate.value = today;
  displayAmount.value = "";
  dateError.value = null;
  dateMenu.value = false;
}
</script>

<template>
  <v-card elevation="8" color="surface" class="mx-auto">
    <v-card-title class="bg-primary text-on-primary d-flex align-center justify-space-between">
      {{ t('addTrans.title') }}
        <v-tooltip :text="t('common.help')">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" :aria-label="t('common.help')"
            icon="mdi-help"
            variant="text" size="small" @click="showKeyboardShortcuts =true"/>
          </template>
        </v-tooltip>
    </v-card-title>

    <v-form ref="newTransactionForm" @submit.prevent="onSubmit" class="pa-4">
      <v-text-field
        v-model="transaction!.description"
        :label="t('addTrans.labelDescription')"
        variant="outlined"
        :rules="[rules.required]"
        prepend-inner-icon="mdi-format-text"
      />

      <v-menu
        v-model="dateMenu"
        :close-on-content-click="false"
        location="bottom center"
      >
        <template v-slot:activator="{ props }">
          <v-text-field
            v-bind="props"
            v-model="formattedDisplayDate"
            :label="t('addTrans.labelDate')"
            variant="outlined"
            readonly
            :rules="[rules.dateRequired]"
            :error-messages="dateError"
            prepend-inner-icon="mdi-calendar"
          />
        </template>
        <v-date-picker
          v-model="pickerDate"
          @update:model-value="onDateSelected"
          color="primary"
        />
      </v-menu>

      <v-radio-group
        v-model="transaction!.transaction_type"
        inline
        :label="t('addTrans.labelType')"
        :rules="[rules.transactionTypeRequired]"
      >
        <v-radio :label="t('addTrans.labelIncome')" :value="TransactionTypeValues.Income" color="success" />
        <v-radio :label="t('addTrans.labelExpense')" :value="TransactionTypeValues.Expense" color="error" />
      </v-radio-group>

      <v-text-field
        v-model="displayAmount"
        :label="t('addTrans.labelAmount')"
        :placeholder="amountPlaceholder"
        :hint="amountHint"
        persistent-hint
        variant="outlined"
        :class="[isFocused ? '' : colorClass, 'money-field']"
        @focus="handleFocus"
        @blur="handleBlur"
        :rules="[rules.amountRules]"
      />

      <div class="d-flex justify-end mt-4">
        <v-btn
          variant="outlined"
          color="secondary"
          class="mr-2"
          @click="resetForm"
        >
          {{ t('addTrans.btnReset') }}
        </v-btn>

        <v-btn
          type="submit"
          color="primary"
          elevation="4"
        >
          {{ t('addTrans.btnAdd') }}
        </v-btn>
      </div>
    </v-form>

    <v-dialog v-model="showKeyboardShortcuts" max-width="400">
      <KeyboardShortcutsDialog v-if="showKeyboardShortcuts" @close="showKeyboardShortcuts = false" />
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