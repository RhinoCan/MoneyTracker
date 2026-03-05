<script setup lang="ts">
import { ref, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useDateFormatter } from "@/composables/useDateFormatter";
import DeleteTransaction from "@/components/DeleteTransaction.vue";
import UpdateTransaction from "@/components/UpdateTransaction.vue";
import Amount from "@/components/Amount.vue";
import type { Transaction } from "@/types/Transaction";
import { useI18n } from "vue-i18n";
import { useLocale } from "vuetify";

const transactionStore = useTransactionStore();
const { t } = useI18n();
const { isRtl } = useLocale();
const { formatToMediumDate } = useDateFormatter();

// --- Table State ---
const search = ref("");
const page = ref(1);
const itemsPerPage = ref(10);
const transactionToDelete = ref<Transaction | null>(null);
const transactionToUpdate = ref<Transaction | null>(null);

// --- Header Definitions ---
const headers = computed(() => [
  {
    key: "description",
    title: t("common.description"),
    sortable: true,
    align: "start" as const,
  },
  {
    key: "date",
    title: t("common.date"),
    sortable: true,
    align: "start" as const,
  },
  {
    key: "transaction_type",
    title: t("common.type"),
    sortable: true,
    align: "start" as const,
  },
  {
    key: "amount",
    title: t("common.amount"),
    sortable: true,
    align: "end" as const,
  },
  {
    key: "actions",
    title: t("history.actions"),
    sortable: false,
    align: "center" as const,
    width: "120px",
  },
]);

const transactions = computed(() => transactionStore.transactions);

// --- Pagination Logic ---
const pageStatusText = computed(() => {
  const total = transactions.value.length;
  if (total === 0) return t("history.pageText", { start: 0, end: 0, total: 0 });

  const start = (page.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(page.value * itemsPerPage.value, total);

  return t("history.pageText", { start, end, total });
});
</script>

<template>
  <v-card color="surface" elevation="8" class="rounded-lg overflow-hidden">
    <v-card-title class="bg-primary text-on-primary py-4 d-flex align-center">
      <v-icon start icon="mdi-history" />
      {{ t("history.title") }}
    </v-card-title>

    <v-card-text class="pa-0">
      <v-text-field
        v-model="search"
        :label="t('history.search')"
        prepend-inner-icon="mdi-magnify"
        variant="filled"
        hide-details
        clearable
        class="search-field"
      />

      <v-data-table
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="transactions"
        :search="search"
        :loading="transactionStore.loading"
        hover
        class="transaction-table"
      >
        <template
          v-for="h in headers"
          :key="h.key"
          v-slot:[`header.${h.key}`]="{ column, isSorted, getSortIcon }"
        >
          <div
            :class="[
              'd-inline-flex align-center w-100',
              column.align === 'end' ? 'justify-end' :
              column.align === 'center' ? 'justify-center' : 'justify-start',
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
          <tr class="transaction-row">
            <td class="font-weight-medium">{{ item.description }}</td>
            <td class="text-nowrap">{{ formatToMediumDate(item.date) }}</td>
            <td class="text-nowrap">
              <v-chip size="x-small" label class="text-uppercase font-weight-bold">
                {{ t(`common.${item.transaction_type}`) }}
              </v-chip>
            </td>
            <td class="text-right">
              <Amount :amount="item.amount" :type="item.transaction_type" />
            </td>
            <td>
              <div class="d-flex justify-center ga-2">
                <v-btn
                  elevation="4"
                  data-testid="update-btn"
                  icon="mdi-pencil"
                  color="amber-darken-2"
                  variant="text"
                  rounded="true"
                  size="small"
                  :aria-label="t('history.ariaUpdate')"
                  @click="transactionToUpdate = item"
                />
                <v-btn
                  elevation="4"
                  data-testid="delete-btn"
                  icon="mdi-delete"
                  color="error"
                  variant="text"
                  rounded="true"
                  size="small"
                  :aria-label="t('history.ariaDelete')"
                  @click="transactionToDelete = item"
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
          <v-divider />
          <div class="d-flex align-center justify-end px-4 py-3 ga-4 flex-wrap">
            <div class="d-flex align-center ga-2">
              <span class="text-caption font-weight-medium">{{ t("history.itemsPerPage") }}</span>
              <v-select
                v-model="itemsPerPage"
                :items="[5, 10, 25, 50]"
                density="compact"
                variant="outlined"
                hide-details
                style="width: 90px"
              />
            </div>

            <span class="text-caption font-weight-bold">
              {{ pageStatusText }}
            </span>

            <div class="d-flex align-center ga-1">
              <v-btn
                :icon="isRtl ? 'mdi-page-last' : 'mdi-page-first'"
                :disabled="page <= 1"
                variant="plain"
                size="small"
                @click="page = 1"
              />
              <v-btn
                :icon="isRtl ? 'mdi-chevron-right' : 'mdi-chevron-left'"
                :disabled="page <= 1"
                variant="plain"
                size="small"
                @click="page--"
              />
              <v-btn
                :icon="isRtl ? 'mdi-chevron-left' : 'mdi-chevron-right'"
                :disabled="page >= pageCount"
                variant="plain"
                size="small"
                @click="page++"
              />
              <v-btn
                :icon="isRtl ? 'mdi-page-first' : 'mdi-page-last'"
                :disabled="page >= pageCount"
                variant="plain"
                size="small"
                @click="page = pageCount"
              />
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card-text>

    <DeleteTransaction v-model="transactionToDelete" />
    <UpdateTransaction v-model="transactionToUpdate" />
  </v-card>
</template>

<style scoped>
.custom-header-text {
  font-weight: 800;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(0,0,0,0.6);
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

.transaction-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.02);
}

:deep(.v-data-table__th) {
  background-color: #f8f9fa !important;
  border-bottom: 2px solid #eeeeee !important;
}
</style>
