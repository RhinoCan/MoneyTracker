<script setup lang="ts">
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import { useDateFormatter } from '@/composables/useDateFormatter.ts';
import DeleteTransaction from "@/components/DeleteTransaction.vue";
import UpdateTransaction from "@/components/UpdateTransaction.vue";
import Money from "@/components/Money.vue";
import { TransactionType } from "@/types/Transaction.ts";

const storeTransaction = useTransactionStore();
const { displayMoney } = useCurrencyFormatter();

type Item = {
  id: number;
  description: string;
  date: string;
  transactionType: TransactionType;
  amount: number;
};

const search = ref("");
const selectedItemDelete = ref<Item | null>(null);
const selectedItemUpdate = ref<Item | null>(null);

import type { DataTableHeader } from "vuetify";

const headers = ref<DataTableHeader<Item>[]>([
  { key: "id", title: "ID", sortable: true, align: "end" },
  { key: "description", title: "Description", sortable: true, align: "start" },
  { key: "date", title: "Date", sortable: true, align: "start" },
  { key: "transactionType", title: "Type", sortable: true, align: "start" },
  { key: "amount", title: "Amount", sortable: true, align: "end" },
  { key: "actions", title: "Actions", sortable: false, align: "center" },
]);

const { formatDate } = useDateFormatter();

const items = computed(() => storeTransaction.transactions);
</script>

<template>
  <v-card color="surface" elevation="8">
    <v-card-title class="bg-primary primary-on-text">History</v-card-title>

    <v-text-field
      v-model="search"
      label="Search"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      hide-details
      single-line
    />

    <v-data-table
      :headers="headers"
      :items="items"
      item-key="id"
      items-per-page="10"
      :search="search"
    >
      <!-- ONE SLOT FOR ALL HEADERS -->
      <template v-for="h in headers" v-slot:[`header.${h.key}`]="{ column }">
        <span class="header">{{ column.title }}</span>
      </template>

      <!-- ROW TEMPLATE -->
      <template #item="{ item }">
        <tr>
          <td class="right">{{ item.id }}</td>
          <td>{{ item.description }}</td>
          <td>{{ formatDate(item.date) }}</td>
          <td>{{ item.transactionType }}</td>

          <td class="right">
            <Money :amount="item.amount" :type="item.transactionType" />
          </td>

          <td class="center">
            <v-btn
              icon="mdi-pencil"
              color="orange"
              size="medium"
              class="me-2"
              variant="elevated"
              elevation="8"
              @click="selectedItemUpdate = item"
            />

            <v-btn
              icon="mdi-delete"
              color="red"
              size="medium"
              class="me-2"
              variant="elevated"
              elevation="8"
              @click="selectedItemDelete = item"
            />
          </td>
        </tr>
      </template>
    </v-data-table>

    <DeleteTransaction v-model="selectedItemDelete" />
    <UpdateTransaction v-model="selectedItemUpdate" />
  </v-card>
</template>

<style scoped>
span.header {
  font-weight: 700;
  font-size: larger;
}
.left {
  text-align: left;
}
.center {
  text-align: center;
}
.right {
  text-align: right;
}
</style>
