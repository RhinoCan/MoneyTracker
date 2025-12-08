<script setup lang="ts">
import { useTransactionStore } from "@/stores/TransactionStore.ts";
const storeTransaction = useTransactionStore();

import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
//Call the composable function, which returns an object.
//Destructure the 'displayMoney' property from that return
const { displayMoney } = useCurrencyFormatter();
</script>

<template>

    <v-row>
      <v-col cols="6">
        <v-card>
          <v-card-title class="bg-green"> Income </v-card-title>
          <v-card-text class="money plus">
            {{ displayMoney(storeTransaction.getIncome) }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card>
          <v-card-title class="bg-red"> Expense </v-card-title>
          <v-card-text class="money minus">
            {{ displayMoney(storeTransaction.getExpense) }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

</template>
