<script setup lang="ts">
import TrackerAbout from "@/components/TrackerAbout.vue";
import AccountSummary from "@/components/AccountSummary.vue";
import TransactionHistory from "@/components/TransactionHistory.vue";
import AddTransaction from "@/components/AddTransaction.vue";
</script>

<template>
  <v-container :max-width="1000" class="bg-grey-lighten-3 pa-4">
    <v-row no-gutters>
      <v-col cols="12" class="mb-4">
        <TrackerAbout />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="12" class="mb-4">
        <AccountSummary />
      </v-col>
    </v-row>

    <v-row no-gutters>
      <v-col cols="12" class="mb-4">
        <TransactionHistory />
      </v-col>
    </v-row>

    <AddTransaction />
  </v-container>
</template>

<style scoped>
/* Scoped styles to ensure the container feels like a page */
.v-container {
  min-height: calc(100vh - 64px); /* Accounting for a standard toolbar height */
}
</style>
