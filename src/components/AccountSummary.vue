<script setup lang="ts">
import { computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import Money from "@/components/Money.vue";

const storeTransaction = useTransactionStore();
const { displayMoney } = useCurrencyFormatter();

// Compute totals using the store
const income = computed(() => storeTransaction.getIncome);
const expense = computed(() => storeTransaction.getExpense);
const balance = computed(() => storeTransaction.getBalance);

</script>

<template>
  <v-card elevation="8" color="surface">
    <v-card-title class="bg-primary text-on-primary"
      >Account Summary</v-card-title
    >
      <v-alert type="info" variant="tonal" v-if="storeTransaction.transactions.length <= 0">
        You won't see anything but zeroes here until you add at least one Transaction via the <strong>Add New Transaction</strong> form below.
      </v-alert>


    <table class="summary-table mt-4 mb-4">
      <tbody>
        <tr>
          <td class="amount">
            <Money :amount="income" type="Income"/>
          </td>
          <td class="label">Total Income</td>
        </tr>

        <tr>
          <td class="amount">
            -&nbsp;<Money :amount="expense" type="Expense"/>
          </td>
          <td class="label">Total Expense</td>
        </tr>

        <!-- Divider inside the same amount column -->
        <tr>
          <td class="amount amount-divider">
            <div class="divider-line"></div>
          </td>
          <td></td>
        </tr>

        <tr>
          <td class="amount">
            <Money :amount="balance" type="Balance"/>
          </td>
          <td class="label">Balance</td>
        </tr>
      </tbody>
    </table>
  </v-card>
</template>

<style scoped>
.summary-table {
  width: auto;
  margin: 0 auto;
  border-collapse: collapse;
}

.summary-table .amount {
  text-align: right;
  padding-right: 12px;
  white-space: nowrap;
  width: 1px; /* shrink-wraps to widest number */
  font-variant-numeric: tabular-nums;
}

.summary-table .label {
  text-align: left;
  padding-left: 12px;
}

.amount-divider {
  padding: 0; /* remove padding that would misalign the divider */
}

.divider-line {
  border-bottom: 3px solid rgba(0, 0, 0, 0.3);
  width: 100%; /* exactly width of amount column */
  margin-top: 6px;
  margin-bottom: 6px;
}
</style>
