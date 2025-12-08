<script setup lang="ts">
import { computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";

// Pinia store for transactions
const storeTransaction = useTransactionStore();

// Compute total balance
const totalBalance = computed(() => {
  return storeTransaction.getBalance;
});

//Call the composable function, which returns an object.
//Destructure the 'displayMoney' property from that return
const { displayMoney } = useCurrencyFormatter();
</script>

<template>
  <v-card elevation="8">
    <v-card-title class="bg-yellow">Account Balance</v-card-title>
    <v-card-text>
      <p v-if="storeTransaction.getBalance >= 0" class="money plus">
        {{ displayMoney(storeTransaction.getBalance) }}
      </p>
      <p v-else class="money minus">
        {{ displayMoney(storeTransaction.getBalance) }}
      </p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
h2 {
  margin: 0;
  font-size: 2rem;
}
</style>
