<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import { parseCurrency } from "@/utils/currencyParser.ts";

import { TransactionType, Transaction } from "@/types/Transaction.ts";
import { SubmitEventPromise } from "vuetify";

const storeTransaction = useTransactionStore();
const { displayMoney } = useCurrencyFormatter();

// The component's v-model prop (The full Transaction object)
type Item = Transaction | null;
const model = defineModel<Item>({ required: true });

// CRITICAL FIX: Local ref to hold a DEEP COPY of the transaction for editing.
// This prevents direct mutation of the store's data until Update is pressed.
const localTransaction = ref<Transaction | null>(null);

// Local state for the input field's display value and focus state
const displayAmount = ref('');
const isFocused = ref(false);

// ------------------------------------
// Initialization Watcher - Creates a Deep Copy
// ------------------------------------
watch(model, (newModel) => {
    if (newModel) {
        // Create a deep copy to edit the local data.
        localTransaction.value = JSON.parse(JSON.stringify(newModel));

        // CHECK ADDED: Only proceed if the copy was successfully created
        if (localTransaction.value) {
            // Initialize the display field with the formatted currency string from the copy
            displayAmount.value = displayMoney(localTransaction.value.amount);
        }
    } else {
        // Clear local state when the dialog closes
        localTransaction.value = null;
        displayAmount.value = '';
        isFocused.value = false;
    }
}, { immediate: true });

// ------------------------------------
// Computed property to determine the display color class
// ------------------------------------
const colorClass = computed(() => {
    // Apply color ONLY when NOT focused AND a type is selected
    if (isFocused.value || !localTransaction.value) return '';

    return localTransaction.value.transactionType === "Income" ? "money-plus" : "money-minus";
});


// ------------------------------------
// FOCUS/BLUR Handlers
// ------------------------------------
const handleFocus = () => {
    isFocused.value = true;

    // On focus: use the local transaction's amount and show it as a raw string
    const numericAmount = localTransaction.value ? localTransaction.value.amount : parseCurrency(displayAmount.value);

    if (numericAmount !== null && numericAmount !== undefined) {
        // Show raw number string (2 decimal places)
        displayAmount.value = numericAmount.toFixed(2);
    } else {
        displayAmount.value = '';
    }
};

const handleBlur = () => {
    isFocused.value = false;

    // 1. Attempt to parse the raw string input
    const parsedAmount = parseCurrency(displayAmount.value);

    // 2. Update the underlying LOCAL copy object with the newly parsed number
    if (localTransaction.value) {
        if (parsedAmount !== null && parsedAmount > 0) {
             localTransaction.value.amount = parsedAmount;
        } else {
             // If invalid/empty, set amount to 0 in the local copy (for validation)
             localTransaction.value.amount = 0;
        }
    }

    // 3. Re-format the numeric value back to the currency string for display
    if (parsedAmount !== null && parsedAmount > 0) {
        displayAmount.value = displayMoney(parsedAmount);
    } else {
        // Clear the field display if invalid
        displayAmount.value = '';
    }
};


// ------------------------------------
// Validation Rules
// ------------------------------------
const rules = {
  descriptionRequired: (value: string) => !!value || "Description is required",
  transactionTypeRequired: (value: TransactionType | null) =>
    !!value || "Transaction Type must be chosen",
  amountValidations: (v: string) => {
    const parsed = parseCurrency(v);
    return (!!parsed && parsed > 0) || "Amount must be supplied and must be greater than zero";
  },
};

function closeDialog() {
  // Setting the model to null closes the dialog.
  // If we press Cancel, the localTransaction copy is simply abandoned.
  model.value = null;
}

async function onSubmit(event: SubmitEventPromise) {
  const { valid } = await event;
  if (!valid || !localTransaction.value) return;

  // Only update the store's data with the local copy when the user confirms
  storeTransaction.updateTransaction(localTransaction.value);

  closeDialog();
}
</script>

<template>
  <v-dialog
    v-if="localTransaction"
    :model-value="!!model"
    @update:model-value="closeDialog"
    max-width="500"
    persistent
  >
    <template #default>
      <v-card color="surface" variant="elevated" class="mx-auto">
        <v-card-title class="bg-primary text-on-primary"
          >Update Transaction</v-card-title
        >
        <v-form @submit.prevent="onSubmit">
          <v-card-text>
            <p class="mb-4">
              Change any part of the transaction you like, apart from the key
              (which is the ID):
            </p>
            <v-row>
              <v-col cols="3">
                <v-text-field
                  label="Id"
                  disabled
                  :model-value="localTransaction?.id"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="9">
                <v-text-field
                  label="Description"
                  v-model="localTransaction!.description"
                  variant="outlined"
                  :rules="[rules.descriptionRequired]"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-radio-group
                  v-model="localTransaction!.transactionType"
                  inline
                  label="Transaction Type"
                  :rules="[rules.transactionTypeRequired]"
                >
                  <v-radio label="Income" value="Income" />
                  <v-radio label="Expense" value="Expense" />
                </v-radio-group>
              </v-col>

              <v-col cols="6">
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
                    style="cursor: pointer;"
                  />
              </v-col>
            </v-row>
            <p>
              Press the UPDATE TRANSACTION button to update the transaction with
              the values you have changed. Press the CANCEL button to quit the
              update.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              text="Cancel"
              variant="outlined"
              elevated="16"
              color="secondary"
              class="mr-2"
              @click="closeDialog"
            ></v-btn>
            <v-btn
              text="Update Transaction"
              variant="elevated"
              elevated="8"
              color="primary"
              type="submit"
              @click="onSubmit"
            ></v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped>
/* 1. Base style for the input element (font size) */
.money-field :deep(.v-field__input) {
    font-size: 20px !important; /* Force larger font size */
    letter-spacing: 1px;
    padding-top: 5px;
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