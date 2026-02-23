<script setup lang="ts">
import { computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useSettingsStore } from "@/stores/SettingsStore";

import { useI18n } from "vue-i18n";
import { logInfo, logException } from "@/lib/Logger";

const emit = defineEmits(["close"]);

const { t } = useI18n();

// Initialize all stores
const storeTransaction = useTransactionStore();
const settingsStore = useSettingsStore();

const transactions = computed(() => storeTransaction.transactions);

/**
 * handleDeleteAllTransactions
 * Clears transactions from DB and local state.
 */
const handleDeleteAllTransactions = async () => {
  if (confirm(t("management.confirmDeleteAllTransactions"))) {
    try {
      await storeTransaction.deleteAllTransactions();
      emit("close");
    } catch {
      //do nothing; store has already handled any exceptions.
    }
  }
};

/**
 * handleDeleteAllSettings
 * Resets all settings stores to defaults and persists them to the DB.
 */
/**
 * Path B: Restore Only Settings
 * Resets local states and overwrites the DB with defaults.
 */
const handleDeleteAllSettings = async () => {
  if (confirm(t("management.confirmRestoreAllSettings"))) {
    try {
      // 1. Reset local Pinia state
      settingsStore.restoreDefaults();

      // 2. Persist those defaults to the DB
      // Note: We await saveToDb which we defined in the new SettingsStore
      await settingsStore.saveToDb();

      logInfo("The settings were all restored to their default values.", {
        module: "ManagementDialog",
        action: "restore_defaults",
      });

      // We don't necessarily need to close if the user just wants to reset and keep working,
      // but keeping your emit("close") for consistency.
      emit("close");
    } catch (error) {
      logException(error, {
        module: "ManagementDialog",
        action: "handleDeleteAllSettings",
        slug: t("management.restore_settings_failed"),
      });
    }
  }
};

/**
 * handleDeleteAllData
 * Nuclear option: Clears everything (Transactions + Settings).
 */
/**
 * Path C: Nuclear Option
 * Clears Transactions + Settings and reloads the app.
 */
const handleDeleteAllData = async () => {
  if (confirm(t("management.confirmDeleteEverything"))) {
    try {
      // Clear all DB tables for this user concurrently
      await Promise.all([
        storeTransaction.deleteAllTransactions(),
        settingsStore.clearFromDb(), // This function now exists in our new store
      ]);

      // Clear any remaining traces
      localStorage.clear();
      sessionStorage.clear();

      logInfo("All transactions deleted and all settings reset to defaults.", {
        module: "ManagementDialog",
        action: "full_wipe",
      });

      // Reloading is the safest way to ensure all stores re-initialize from zero
      window.location.reload();
    } catch (error) {
      logException(error, {
        module: "ManagementDialog",
        action: "handleDeleteAllData",
        slug: t("management.full_wipe_failed"),
      });
    }
  }
};

const handleExport = () => {
  const dataToExport = storeTransaction.transactions;
  if (dataToExport.length === 0) return;

  // Header row
  const headers = ["Date", "Description", "Type", "Amount"].join(",");

  // Data rows
  const rows = dataToExport.map((transaction) => {
    const cleanDate = transaction.date ? transaction.date.substring(0, 10) : "";
    const cleanDesc = `"${transaction.description.replace(/"/g, '""')}"`;

    return [cleanDate, cleanDesc, transaction.transaction_type, transaction.amount].join(",");
  });

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logInfo("The data was exported to a CSV file.", {
    module: "ManagementDialog",
    action: "export_csv",
  });
};
</script>

<template>
  <v-card class="data-management-card">
    <v-card-title class="bg-primary text-on-primary d-flex align-center justify-space-between">
      <span>{{ t("management.title") }}</span>
      <v-btn icon="mdi-close" variant="text" density="comfortable" @click="$emit('close')" />
    </v-card-title>

    <v-card-text class="pa-6">
      <section class="mb-8">
        <h3 class="text-h6 mb-2">{{ t("management.exportTitle") }}</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ t("management.exportText") }}</p>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-export"
          :disabled="transactions.length === 0"
          @click="handleExport"
        >
          {{ t("management.btnExport") }}
        </v-btn>
      </section>

      <v-divider class="mb-8"></v-divider>

      <section>
        <h3 class="text-h6 text-warning mb-4">{{ t("management.dangerZone") || "Danger Zone" }}</h3>

        <div class="mb-6">
          <div class="text-subtitle-1 font-weight-bold">{{ t("management.deleteTransTitle") }}</div>
          <p class="text-caption mb-2">{{ t("management.deleteTransText") }}</p>
          <v-btn color="warning" size="small" @click="handleDeleteAllTransactions">
            {{ t("management.btnDeleteTrans") }}
          </v-btn>
        </div>

        <div class="mb-6">
          <div class="text-subtitle-1 font-weight-bold">
            {{ t("management.restoreSettingsTitle") }}
          </div>
          <p class="text-caption mb-2">{{ t("management.restoreSettingsText") }}</p>
          <v-btn color="warning" size="small" @click="handleDeleteAllSettings">
            {{ t("management.btnRestoreSettings") }}
          </v-btn>
        </div>

        <v-divider class="my-6"></v-divider>

        <div>
          <div class="text-subtitle-1 font-weight-bold text-error">
            {{ t("management.deleteEverythingTitle") }}
          </div>
          <p class="text-caption mb-2">{{ t("management.deleteEverythingText") }}</p>
          <v-btn color="error" variant="elevated" @click="handleDeleteAllData">
            {{ t("management.btnDeleteEverything") }}
          </v-btn>
        </div>
      </section>
    </v-card-text>

    <v-card-actions class="bg-grey-lighten-4 pa-4">
      <v-spacer />
      <v-btn variant="text" color="grey-darken-1" @click="$emit('close')">
        {{ t("common.close") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.data-management-card {
  max-width: 600px;
  border-radius: 12px;
}
</style>
