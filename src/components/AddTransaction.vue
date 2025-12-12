<script lang="ts" setup>
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import { parseCurrency } from "@/utils/currencyParser.ts";

import Money from "@/components/Money.vue"; // <-- Ensure this is imported
import { TransactionType, Transaction } from "@/types/Transaction.ts";
import type { SubmitEventPromise } from "vuetify";

const storeTransaction = useTransactionStore();
const { displayMoney } = useCurrencyFormatter();

// Form models
const descriptionModel = ref("");
const transactionTypeModel = ref<TransactionType | null>(null);

// String ref for the raw/formatted input field
const displayAmount = ref("");
// State to track focus, used to switch content in the #default slot
const isFocused = ref(false);

const newTransactionForm = ref();
// const amountFieldRef = ref(null); // Not strictly needed for this version, but harmless if kept

// ------------------------------------
// Computed property to determine the display color class
// ------------------------------------
const colorClass = computed(() => {
  // Apply color ONLY when NOT focused AND a type is selected
  if (isFocused.value || !transactionTypeModel.value) return "";

  // Returns the custom CSS classes defined in <style scoped>
  return transactionTypeModel.value === "Income" ? "money-plus" : "money-minus";
});

// ------------------------------------
// ADDED: Computed property to derive the number needed by Money.vue
// ------------------------------------
const currentAmount = computed(() => {
  // Parse the current display string into a number
  const parsedAmount = parseCurrency(displayAmount.value);
  return {
    parsedAmount: parsedAmount,
  };
});

// ------------------------------------
// FOCUS/BLUR Handlers (from the last working logic)
// ------------------------------------
const handleFocus = () => {
  isFocused.value = true;

  // On focus: parse the current display string (which might be formatted)
  const numericAmount = parseCurrency(displayAmount.value);

  if (numericAmount !== null && numericAmount !== undefined) {
    // Show raw number string (2 decimal places)
    displayAmount.value = numericAmount.toFixed(2);
  } else {
    displayAmount.value = "";
  }
};

const handleBlur = () => {
  isFocused.value = false;

  // 1. Attempt to parse the raw string input
  const parsedAmount = parseCurrency(displayAmount.value);

  // Check if the input value resulted in a valid, positive number
  if (parsedAmount !== null && parsedAmount > 0) {
    // If valid, apply formatting
    displayAmount.value = displayMoney(parsedAmount);
  } else {
    // If parsing fails (e.g., empty, zero, or only invalid chars), clear the field
    displayAmount.value = "";
  }
};

// ------------------------------------
// Validation rules
// ------------------------------------
const rules = {
  descriptionRequired: (v: string) => !!v || "Description is required",
  transactionTypeRequired: (v: TransactionType | null) =>
    !!v || "Transaction Type must be chosen",
  amountValidations: (v: string) => {
    const parsed = parseCurrency(v);
    return (
      (!!parsed && parsed > 0) ||
      "Amount must be supplied and must be greater than zero"
    );
  },
};

// ------------------------------------
// Submit handler
// ------------------------------------
async function onSubmit(event: SubmitEventPromise) {

  const { valid } = await event;
  if (!valid) return;

  const finalAmount = parseCurrency(displayAmount.value);

  const newTransaction: Transaction = {
    id: storeTransaction.getNewId,
    description: descriptionModel.value,
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
  transactionTypeModel.value = null;
  displayAmount.value = "";
  isFocused.value = false;
}
</script>


<template>
  <v-card elevation="8" color="surface" class="mx-auto">
    <v-card-title class="bg-primary primary-with-text"
      >Add New Transaction</v-card-title
    >
    <v-form id="form" ref="newTransactionForm" @submit.prevent="onSubmit">
      <v-text-field
        label="Description"
        v-model="descriptionModel"
        variant="outlined"
        :rules="[rules.descriptionRequired]"
        class="mt-2"
      />

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
