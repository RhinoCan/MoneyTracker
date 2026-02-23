<script setup lang="ts">
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useDateFormatter } from "@/composables/useDateFormatter";
import DeleteTransaction from "@/components/DeleteTransaction.vue";
import UpdateTransaction from "@/components/UpdateTransaction.vue";
import Money from "@/components/Money.vue";
import { Transaction } from "@/types/Transaction";
import { i18n } from "@/i18n";
import { useLocale, type DataTableHeader } from "vuetify";

const storeTransaction = useTransactionStore();

const t = (i18n.global as any).t;

const { isRtl } = useLocale();

const { formatForUI: formatDate } = useDateFormatter();

// 1. TABLE STATE
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const selectedItemDelete = ref<Transaction | null>(null);
const selectedItemUpdate = ref<Transaction | null>(null);

// 2. HEADER DEFINITIONS
const headers = computed<DataTableHeader[]>(() => [
  {
    key: "description",
    title: t("common.description"),
    sortable: true,
    align: "start",
  },
  { key: "date", title: t("common.date"), sortable: true, align: "start" },
  {
    key: "transaction_type",
    title: t("common.type"),
    sortable: true,
    align: "start",
  },
  { key: "amount", title: t("common.amount"), sortable: true, align: "end" },
  {
    key: "actions",
    title: t("history.actions"),
    sortable: false,
    align: "center",
    width: "120px",
  },
]);

const transactions = computed(() => storeTransaction.transactions);
</script>

<template>
  <v-card color="surface" elevation="8" class="rounded-lg">
    <v-card-title class="bg-primary text-on-primary py-4">
      {{ t("history.title") }}
    </v-card-title>

    <v-card-text class="pa-0">
      <v-text-field
        v-model="search"
        :label="t('history.search')"
        prepend-inner-icon="mdi-magnify"
        variant="filled"
        hide-details
        class="search-field"
      />

      <v-data-table
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="transactions"
        :search="search"
        hover
        class="transaction-table"
        :items-per-page-text="t('history.itemsPerPage')"
        :page-text="
          t('history.pageText', [
            transactions.length > 0 ? (page - 1) * itemsPerPage + 1 : 0,
            Math.min(page * itemsPerPage, transactions.length),
            transactions.length,
          ])
        "
      >
        <template
          v-for="h in headers"
          v-slot:[`header.${h.key}`]="{ column, isSorted, getSortIcon }"
        >
          <div
            :key="h.key"
            :class="[
              'd-inline-flex align-center w-100',
              column.align === 'end'
                ? 'justify-end'
                : column.align === 'center'
                  ? 'justify-center'
                  : 'justify-start',
            ]"
            class="header-container"
          >
            <v-icon
              v-if="column.sortable !== false && column.align === 'end'"
              :icon="isSorted(column) ? getSortIcon(column) : 'mdi-arrow-up'"
              :class="isSorted(column) ? 'active-sort' : 'hint-sort'"
              size="x-small"
              class="me-1"
            />

            <span class="custom-header-text">{{ column.title }}</span>

            <v-icon
              v-if="column.sortable !== false && column.align !== 'end'"
              :icon="isSorted(column) ? getSortIcon(column) : 'mdi-arrow-up'"
              :class="isSorted(column) ? 'active-sort' : 'hint-sort'"
              size="x-small"
              class="ms-1"
            />
          </div>
        </template>

        <template #item="{ item }">
          <tr>
            <td class="font-weight-medium">{{ item.description }}</td>
            <td class="text-nowrap">{{ formatDate(item.date) }}</td>
            <td class="text-nowrap">
              {{ t(`common.${item.transaction_type}`) }}
            </td>
            <td class="text-right">
              <Money :amount="item.amount" :type="item.transaction_type" />
            </td>
            <td>
              <div class="d-flex justify-center ga-2">
                <v-btn
                  icon="mdi-pencil"
                  color="amber-darken-2"
                  size="x-small"
                  @click="selectedItemUpdate = item"
                  :aria-label="t('history.ariaUpdate')"
                />
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  size="x-small"
                  @click="selectedItemDelete = item"
                  :aria-label="t('history.ariaDelete')"
                />
              </div>
            </td>
          </tr>
        </template>

        <template #no-data>
          <v-alert type="info" variant="tonal" class="ma-4">
            <i18n-t keypath="history.alert" tag="span">
              <template #addNew>
                <strong class="text-uppercase">{{ t("common.addNew") }}</strong>
              </template>
            </i18n-t>
          </v-alert>
        </template>

        <template #bottom="{ pageCount }">
          <div class="d-flex align-center justify-end px-4 py-2 ga-4">
            <!-- Items per page -->
            <div class="d-flex align-center ga-2">
              <span v-if="!isRtl" class="text-body-2">{{ t("history.itemsPerPage") }}</span>
              <v-select
                v-model="itemsPerPage"
                :items="[5, 10, 25, 50]"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 120px"
              />
              <span v-if="isRtl" class="text-body-2">{{ t("history.itemsPerPage") }}</span>
            </div>

            <!-- Page text -->
            <span class="text-body-2">
              {{
                t("history.pageText", [
                  transactions.length > 0 ? (page - 1) * itemsPerPage + 1 : 0,
                  Math.min(page * itemsPerPage, transactions.length),
                  transactions.length,
                ])
              }}
            </span>

            <!-- Navigation arrows -->
            <div class="d-flex align-center ga-1">
              <v-btn
                :icon="isRtl ? 'mdi-page-last' : 'mdi-page-first'"
                :disabled="page <= 1"
                variant="text"
                size="small"
                @click="page = 1"
              />
              <v-btn
                :icon="isRtl ? 'mdi-chevron-right' : 'mdi-chevron-left'"
                :disabled="page <= 1"
                variant="text"
                size="small"
                @click="page--"
              />
              <v-btn
                :icon="isRtl ? 'mdi-chevron-left' : 'mdi-chevron-right'"
                :disabled="page >= pageCount"
                variant="text"
                size="small"
                @click="page++"
              />
              <v-btn
                :icon="isRtl ? 'mdi-page-first' : 'mdi-page-last'"
                :disabled="page >= pageCount"
                variant="text"
                size="small"
                @click="page = pageCount"
              />
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>

    <DeleteTransaction v-if="selectedItemDelete" v-model="selectedItemDelete" />
    <UpdateTransaction v-if="selectedItemUpdate" v-model="selectedItemUpdate" />
  </v-card>
</template>

<style scoped>
.custom-header-text {
  font-weight: 800;
  font-size: 0.875rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.header-container {
  cursor: pointer;
  user-select: none;
}

.hint-sort {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.header-container:hover .hint-sort {
  opacity: 0.4;
}

.active-sort {
  opacity: 1;
  color: rgb(var(--v-theme-primary));
}

.search-field {
  border-radius: 0;
}

:deep(.v-data-table__th) {
  background-color: #f8f9fa !important;
}
</style>
