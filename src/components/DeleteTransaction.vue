<script setup lang="ts">
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { computed } from "vue";
import Money from "@/components/Money.vue";
import type { TransactionType } from '@/types/Transaction.ts';

//Call the composable function, which returns an object.
//Destructure the 'displayMoney' property from that return
const { displayMoney } = useCurrencyFormatter();

type Item = {
  id: number;
  description: string;
  transactionType: TransactionType;
  amount: number;
};

const model = defineModel<Item | null>();

const dialogOpen = computed({
  get: () => !!model.value, // returns boolean
  set: (val: boolean) => {
    // accepts boolean
    if (!val) model.value = null; // safely updates model
  },
});

const deleteTransaction = () => {
  const item = model.value;
  let storeTransaction = useTransactionStore();
  if (!item || !item.id) {
    console.log(
      "ConfirmDelete.deleteTransaction() - Transaction id was undefined so nothing was deleted"
    );
  } else {
    storeTransaction.deleteTransaction(item.id);
    console.log(
      "ConfirmDelete.deleteTransaction() - Transaction with id " +
        item.id +
        " deleted"
    );
  }
  model.value = null;
};
</script>

<template>
  <v-dialog v-if="model" v-model="dialogOpen" max-width="500" persistent>
    <template #default>
      <v-card color="surface" variant="elevated" class="mx-auto">
        <v-card-title class="bg-primary text-on-primary"
          >Confirm or Cancel Delete</v-card-title
        >
        <v-card-text>
          <p class="mb-4">
            This is the transaction that you are about to delete:
          </p>
          <v-row dense>
            <v-col cols="6"><strong>Id:</strong></v-col>
            <v-col cols="6">{{ model.id }} </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6"><strong>Description:</strong></v-col>
            <v-col cols="6">{{ model.description }} </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6"><strong>Transaction Type:</strong></v-col>
            <v-col cols="6">{{ model.transactionType }} </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="6"><strong>Amount:</strong></v-col>
            <v-col cols="6"
              ><Money
                :amount="model.amount"
                :type="model.transactionType"
              />
            </v-col>
          </v-row>
          <p class="mt-4">
            Press the DELETE TRANSACTION button to delete the transaction. Press
            the CANCEL button to keep the transaction.
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
            text="Delete Transaction"
            variant="elevated"
            elevated="8"
            color="primary"
            @click="deleteTransaction"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>
