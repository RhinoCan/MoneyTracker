<script setup lang="ts">
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
const storeTransaction = useTransactionStore();
import { TransactionType, Transaction } from "@/types/Transaction.ts";
import { SubmitEventPromise } from "vuetify";

type Item = {
  id: number;
  description: string;
  transactionType: TransactionType;
  amount: number;
};

const model = defineModel<Item | null>();

const formattedAmount = computed({
  get: () => model.value ? model.value.amount.toFixed(2) : '0.0',
  set: val => {
    if (model.value) {
      model.value.amount = parseFloat(val)
    }
  }
})

const rules = {
  descriptionRequired: (value: string) => !!value || "Description is required",
  transactionTypeRequired: (value: TransactionType) =>
    !!value || "Transaction Type must be chosen",
  amountValidations: (value: number) =>
    (!!value && value > 0) ||
    "Amount must be supplied and must be greater than zero",
};

async function onSubmit(event: SubmitEventPromise) {
  const { valid } = await event;

  if (valid && model.value) {
    // console.log("unchanged id: " + model.value.id);
    // console.log("updated description: " + model.value.description);
    // console.log("updated transactionType: " + model.value.transactionType);
    // console.log("updated amount: " + model.value.amount);

    /* Use the original transaction id, which was read-only. The remaining values are read from the
         form fields. */
    const updatedTransaction: Transaction = {
      id: model.value.id,
      description: model.value.description,
      transactionType: model.value.transactionType as TransactionType,
      amount: model.value.amount,
    };

    /* Replace the old transaction in the transactions array with the new values. */
    storeTransaction.updateTransaction(updatedTransaction);

    /* Close the dialog. */
    model.value = null;
  }
}
</script>

<template>
  <v-dialog
    v-if="model"
    :model-value="true"
    @update:model-value="(v: boolean) => (model = null)"
    max-width="500"
    persistent
  >
    <template #default>
      <v-card color="surface" variant="elevated" class="mx-auto">
        <v-card-title class="bg-primary text-on-primary"
          >Update Transaction</v-card-title
        >
        <v-form @submit.prevent="onSubmit" ref="updateTransactionForm">
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
                  :model-value="model.id"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="9">
                <v-text-field
                  label="Description"
                  v-model="model.description"
                  variant="outlined"
                  :rules="[rules.descriptionRequired]"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="6">
                <v-radio-group
                  v-model="model.transactionType"
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
                  v-model.number="formattedAmount"
                  type="number"
                  variant="outlined"
                  :rules="[rules.amountValidations]"
                ></v-text-field>
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
              @click="model = null"
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
