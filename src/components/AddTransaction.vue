<script lang="ts" setup>
import { ref } from "vue";

import { useTransactionStore } from "@/stores/TransactionStore.ts";
const storeTransaction = useTransactionStore();

import { TransactionType, Transaction } from "@/types/Transaction.ts";
import type { SubmitEventPromise } from "vuetify";

// Form models
const descriptionModel = ref("");
const transactionTypeModel = ref<TransactionType | null>(null);
const amountModel = ref<number | null>(null);

const newTransactionForm = ref();

// Validation rules
const rules = {
  descriptionRequired: (v: string) => !!v || "Description is required",

  transactionTypeRequired: (v: TransactionType | null) =>
    !!v || "Transaction Type must be chosen",

  amountValidations: (v: number | null) =>
    Number(v) > 0 || "Amount must be supplied and must be greater than zero",
};

// Submit handler
async function onSubmit(event: SubmitEventPromise) {
  const { valid } = await event;
  if (!valid) return;

  const newTransaction: Transaction = {
    id: storeTransaction.getNewId,
    description: descriptionModel.value,
    transactionType: transactionTypeModel.value!,
    amount: Number(amountModel.value),
  };

  storeTransaction.addTransaction(newTransaction);
  resetForm();
}

// Properly clears both models and v-form internal validation
function resetForm() {
  newTransactionForm.value.reset();

  // Ensure radio + fields get fully reset
  descriptionModel.value = "";
  transactionTypeModel.value = null;
  amountModel.value = null;
}
</script>

<template>
  <v-card elevation="8" color="surface" class="mx-auto">
    <v-card-title class="bg-primary primary-with-text"
      >Add New Transaction</v-card-title
    >
    <v-form id="form" ref="newTransactionForm" @submit.prevent="onSubmit">
      <v-text-field
        class="mt-2"
        label="Description"
        v-model="descriptionModel"
        variant="outlined"
        :rules="[rules.descriptionRequired]"
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
        v-model="amountModel"
        variant="outlined"
        type="number"
        :rules="[rules.amountValidations]"
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
