<script setup lang="ts">
import { computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import Money from "@/components/Money.vue";
import { i18n } from "@/i18n";

const t = (i18n.global as any).t;

const storeTransaction = useTransactionStore();

// Capture totals from the store's getters
const income = computed(() => storeTransaction.getIncome);
const expense = computed(() => storeTransaction.getExpense);
const balance = computed(() => storeTransaction.getBalance);

const hasTransactions = computed(
  () => storeTransaction.transactions.length > 0,
);
</script>

<template>
  <v-card elevation="8" color="surface" class="mb-4">
    <v-card-title class="bg-primary text-on-primary">
      {{ t("accountSummary.title") }}
    </v-card-title>

    <v-card-text class="pa-4">
      <v-fade-transition mode="out-in">
        <div v-if="!hasTransactions" key="empty">
          <v-alert type="info" variant="tonal">
            <i18n-t keypath="accountSummary.alert" tag="p">
              <template #addNew>
                <span class="font-weight-bold text-primary">
                  {{ t("common.addNew") }}
                </span>
              </template>
            </i18n-t>
          </v-alert>
        </div>

        <table v-else key="table" class="summary-table my-2">
          <tbody>
            <tr>
              <td class="amount">
                <Money :amount="income" type="Income" />
              </td>
              <td class="label">{{ t("accountSummary.income") }}</td>
            </tr>

            <tr>
              <td class="amount">
                <span class="mr-1">-</span>
                <Money :amount="expense" type="Expense" />
              </td>
              <td class="label">{{ t("accountSummary.expense") }}</td>
            </tr>

            <tr>
              <td class="amount amount-divider">
                <div class="divider-line"></div>
              </td>
              <td></td>
            </tr>

            <tr>
              <td class="amount text-h6 font-weight-bold">
                <Money :amount="balance" type="Balance" />
              </td>
              <td class="label text-h6 font-weight-bold">
                {{ t("accountSummary.balance") }}
              </td>
            </tr>
          </tbody>
        </table>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.summary-table {
  width: auto;
  margin: 0 auto;
  border-collapse: collapse;
}

.summary-table td {
  padding: 4px 0;
}

.summary-table .amount {
  text-align: right;
  padding-inline-end: 16px;
  white-space: nowrap;
  width: 1px;
  /* Ensures digits line up vertically */
  font-variant-numeric: tabular-nums;
}

.summary-table .label {
  text-align: left;
  padding-inline-start: 16px;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

.amount-divider {
  padding: 0 !important;
}

.divider-line {
  border-bottom: 3px solid rgba(var(--v-border-color), 0.3);
  width: 100%;
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
