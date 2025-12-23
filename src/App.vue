<script setup lang="ts">
import TrackerHeader from "@/components/TrackerHeader.vue";
import TrackerAbout from "@/components/TrackerAbout.vue";
import AccountSummary from "@/components/AccountSummary.vue";
import TransactionHistory from "@/components/TransactionHistory.vue";
import AddTransaction from "@/components/AddTransaction.vue";

import { ref, onMounted } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";

const transactions = ref([]);
const storeTransaction = useTransactionStore();

onMounted(() => {
  const savedTransactions: string | null = localStorage.getItem("transactions");
  if (savedTransactions !== null) {
    storeTransaction.transactions = JSON.parse(savedTransactions);
  }
});
</script>

<template>
  <v-app color="surface">
    <TrackerHeader />
    <v-main class="bg-teal">
      <v-container :max-width="1000" class="bg-grey-lighten-3">
        <TrackerAbout />
        <AccountSummary />
        <TransactionHistory />
        <AddTransaction />
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
.v-application {
  background-color: #f5f5f5 !important;
}
main.v-main {
  background-color: #f5f5f5 !important;
}
</style>
