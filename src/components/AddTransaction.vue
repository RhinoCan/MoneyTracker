<script lang="ts" setup>
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useDateFormatter } from "@/composables/useDateFormatter.ts";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";
import { parseCurrency } from "@/utils/currencyParser.ts";
import { TransactionType, Transaction } from "@/types/Transaction.ts";
import type { SubmitEventPromise } from "vuetify";
import { formatISO, parseISO } from "date-fns";
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog.vue";

const showKeyboardShortcuts = ref(false);

const storeTransaction = useTransactionStore();
const { required, transactionTypeRequired, dateRangeRule, amountValidations } =
  useAppValidationRules();

const {
  displayAmount,
  isFocused,
  colorClass,
  handleFocus,
  handleBlur,
  dateMenu,
  closeDatePicker,
} = useTransactionFormFields();

// Form models
const descriptionModel = ref("");
const dateModel = ref<string | null>(null);
const transactionTypeModel = ref<TransactionType | null>(null);

const { formatDate } = useDateFormatter();

const formattedDisplayDate = computed({
  get() {
  const isoDate = dateModel.value;
  if (!isoDate) {
    return '';
  }
  return formatDate(isoDate);
},
set(newValue) {
  //Do nothing. The date is updated directly via the v-date-picker binding to dateModel.value, not through
  //this text field. This setter exists purely to prevent the "Write operation failed" error.
}
})

const dateError = ref<string | null>(null);

function resetState() {
  dateError.value = null;
}

const newTransactionForm = ref();

// ------------------------------------
// Validation rules
// ------------------------------------
const rules = {
  required,
  descriptionRequired: required,
  dateRequired: dateRangeRule,
  transactionTypeRequired: transactionTypeRequired,
  amountValidations: amountValidations,
};

// ------------------------------------
// Submit handler
// ------------------------------------
async function onSubmit(event: SubmitEventPromise) {

  dateError.value = null;

  if (!dateModel.value) {
    return;
  }

  const dateValue = dateModel.value;
  let dateObject: Date;

  if (typeof dateValue === 'string') {
    dateObject = parseISO(dateValue);
  } else {
    dateObject = dateValue as Date;
  }

  const cleanIsoDate = formatISO(dateObject, { representation: 'date' });

  const validationResult = rules.dateRequired(cleanIsoDate);
  if (validationResult !== true) {
    //Validation failed: capture the error message and stop submission.
    dateError.value = validationResult as string;
    return;
  }

  const { valid } = await event;
  if (!valid) return;

  const finalAmount = parseCurrency(displayAmount.value);

  const newTransaction: Transaction = {
    id: storeTransaction.getNewId,
    description: descriptionModel.value,
    date: dateModel.value!,
    transactionType: transactionTypeModel.value!,
    amount: finalAmount || 0,
  };

  storeTransaction.addTransaction(newTransaction);
  resetForm();
}

// ------------------------------------
// resetForm
// ------------------------------------
function resetForm() {
  newTransactionForm.value.reset();
  descriptionModel.value = "";
  dateMenu.value = false;
  dateModel.value = null;
  transactionTypeModel.value = null;
  displayAmount.value = "";
  isFocused.value = false;
  dateError.value = "";
}
</script>

<template>
  <v-card elevation="8" color="surface" class="mx-auto">
    <v-card-title class="bg-primary primary-with-text"
      >Add New Transaction
          <v-btn
            icon="mdi-help"
            variant="text"
            color="white"
            aria-label="Help"
            position="absolute"
            style="top: 0px; right: 8px"
            @click="showKeyboardShortcuts = true"
          />
      </v-card-title
    >
    <v-form id="form" ref="newTransactionForm" @submit.prevent="onSubmit">
      <v-text-field
        label="Description"
        v-model="descriptionModel"
        variant="outlined"
        :rules="[rules.descriptionRequired]"
        class="mt-2"
      />

      <v-menu
        v-model="dateMenu"
        :close-on-content-click="false"
        location="bottom center"
      >
        <template v-slot:activator="{ props }">
          <v-text-field
            label="Transaction Date"
            :key="dateModel || ''"
            v-model="formattedDisplayDate"
            variant="outlined"
            readonly
            v-bind="props"
            validate-on="submit"
            :rules="[rules.required]"
            :error-messages="dateError"
            class="mt-2"
            prepend-inner-icon="mdi-calendar"
          />
        </template>

        <v-date-picker
          v-model="dateModel"
          @update:model-value="closeDatePicker"
          color="primary"
        ></v-date-picker>
      </v-menu>

      <v-radio-group
        v-model="transactionTypeModel"
        inline
        label="Transaction Type"
        :rules="[rules.transactionTypeRequired]"
      >
        <v-radio label="Income" value="Income" />
        <v-radio label="Expense" value="Expense" />
      </v-radio-group>

      <v-text-field
        label="Amount"
        v-model="displayAmount"
        variant="outlined"
        type="text"
        :class="[isFocused ? '' : colorClass, 'money-field']"
        :readonly="!isFocused && !!displayAmount"
        @focus="handleFocus"
        @blur="handleBlur"
        :rules="[rules.amountValidations]"
        placeholder="0.00"
        style="cursor: pointer"
      />
      <div class="text-end mb-2">
        <v-btn
          @click="resetForm"
          color="secondary"
          class="mr-2"
          variant="outlined"
          rounded="lg"
        >
          Reset
        </v-btn>

        <v-btn
          type="submit"
          color="primary"
          elevation="8"
          rounded="lg"
          class="mr-2"
        >
          Add transaction
        </v-btn>
      </div>
    </v-form>
  </v-card>
    <!--KEYBOARD SHORTCUTS DIALOG-->
    <v-dialog v-model="showKeyboardShortcuts" max-width="300">
      <KeyboardShortcutsDialog @close="showKeyboardShortcuts = false" />
    </v-dialog>
</template>

<style scoped>
/* Final Attempt: Apply both size and color using the deepest selector */

/* 1. Base style for the input element (font size) */
/* We target the actual input element within the Vuetify field structure for all size changes */
.money-field :deep(.v-field__input) {
  font-size: 20px !important; /* Force larger font size */
  letter-spacing: 1px;
  margin: 5px 0;
}

/* 2. Color classes: We use the dynamic class (money-plus/minus) on the outer component
      to style the inner input element. */
.money-field.money-plus :deep(.v-field__input) {
  color: #2ecc71 !important; /* Green */
}

.money-field.money-minus :deep(.v-field__input) {
  color: #c0392b !important; /* Red */
}
</style>
