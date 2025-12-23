<script setup lang="ts">
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import { useDateFormatter } from "@/composables/useDateFormatter.ts";
import DeleteTransaction from "@/components/DeleteTransaction.vue";
import UpdateTransaction from "@/components/UpdateTransaction.vue";
import Money from "@/components/Money.vue";
import { Transaction } from "@/types/Transaction.ts";

const storeTransaction = useTransactionStore();
const { displayMoney } = useCurrencyFormatter();
const search = ref("");
const selectedItemDelete = ref<Transaction | null>(null);
const selectedItemUpdate = ref<Transaction | null>(null);

import type { DataTableHeader } from "vuetify";

const headers = ref<DataTableHeader<Transaction>[]>([
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
    <v-card-title class="bg-primary primary-on-text">Transaction History</v-card-title>

    <v-text-field
      v-model="search"
      label="Search"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      hide-details
      single-line
    />

    <v-card color="surface" elevation="8" v-if="items.length <= 0">
      <v-alert type="info" variant="tonal">
        You won't see any transactions here until you add some via the
        <strong>Add New Transaction</strong> form below.
      </v-alert>
    </v-card>

    <v-data-table
      :headers="headers"
      :items="items"
      item-key="id"
      items-per-page="10"
      :search="search"
    >
      <!-- ONE SLOT FOR ALL HEADERS -->
      <template
        v-for="h in headers"
        v-slot:[`header.${h.key}`]="{ column, isSorted, getSortIcon }"
      >
        <div
          :class="[
            'd-inline-flex align-center w-100',
            // Mapping: 'start' -> justify-start, 'end' -> justify-end, 'center' -> justify-center
            column.align === 'end'
              ? 'justify-end'
              : column.align === 'center'
              ? 'justify-center'
              : 'justify-start',
          ]"
          style="cursor: pointer"
        >
          <v-icon
            v-if="column.sortable !== false && column.align === 'end'"
            :icon="isSorted(column) ? getSortIcon(column) : 'mdi-arrow-up'"
            :class="[
              isSorted(column) ? 'opacity-100' : 'opacity-0 header-hover-icon',
              'me-1',
            ]"
            size="small"
          ></v-icon>

          <span class="header">{{ column.title }}</span>

          <v-icon
            v-if="column.sortable !== false && column.align !== 'end'"
            :icon="isSorted(column) ? getSortIcon(column) : 'mdi-arrow-up'"
            :class="[
              isSorted(column) ? 'opacity-100' : 'opacity-0 header-hover-icon',
              'ms-1',
            ]"
            size="small"
          ></v-icon>
        </div>
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
            <div class="d-flex justify-center ga-4 text-nowrap">
              <v-btn
                icon="mdi-pencil"
                color="orange"
                size="medium"
                variant="elevated"
                elevation="8"
                @click="selectedItemUpdate = item"
              />

              <v-btn
                icon="mdi-delete"
                color="red"
                size="medium"
                variant="elevated"
                elevation="8"
                @click="selectedItemDelete = item"
              />
            </div>
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
  white-space: nowrap;
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
CSS

/* Keep the arrow hidden until hover */
.header-hover-icon {
  transition: opacity 0.2s ease;
  color: rgba(0, 0, 0, 0.3); /* Faint color for the hint */
}

/* Show the hint when hovering over the header container */
div.d-inline-flex:hover .header-hover-icon {
  opacity: 1 !important;
}

/* Ensure the active sort arrow is fully visible and likely the primary color */
.opacity-100 {
  opacity: 1 !important;
  color: rgb(var(--v-theme-primary));
}
</style>
