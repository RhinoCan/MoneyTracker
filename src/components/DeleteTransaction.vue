<script setup lang="ts">
import { ref, computed } from "vue";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useTransactionStore } from "@/stores/TransactionStore";
import Money from "@/components/Money.vue";
import type { Transaction } from "@/types/Transaction";
import { logException, logInfo } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { formatForUI } = useDateFormatter();
const storeTransaction = useTransactionStore();

const model = defineModel<Transaction | null>();
const loading = ref(false);

const dialogOpen = computed({
  get: () => !!model.value,
  set: (val: boolean) => {
    if (!val) model.value = null;
  },
});

// Display date in localized format for the text field
const formattedDisplayDate = computed(() => {
  return model.value?.date ? formatForUI(model.value.date) : '';
});

const deleteTransaction = async () => {
  const item = model.value;

  if (!item || !item.id) {
    logException(new Error("Could not delete the transaction because it no longer exists."), {
      module: "DeleteTransaction",
      action: "deleteTransaction",
      slug: t('deleteDialog.error_no_trans')
    });
    model.value = null;
    return;
  }

  loading.value = true;
  try {
    await storeTransaction.deleteTransaction(item.id);

    logInfo("The transaction was deleted.", {
      module: "DeleteTransaction",
      action: "delete_confirmed",
      data: { id: item.id } // We keep the ID in logs for your traceability
    });

    model.value = null;
  } catch (error) {
    logException(new Error("The delete failed because of an error in the UI."), {
      module: "DeleteTransaction",
      action: "delete_failed",
      slug: t('deleteDialog.error_UI'),
      data: item.id
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialogOpen" max-width="450" persistent transition="dialog-bottom-transition">
    <v-card v-if="model" border>
      <v-card-title class="bg-error text-white d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon start icon="mdi-alert-circle-outline" />
          <span>{{ t('deleteDialog.title') }}</span>
        </div>

         <v-tooltip :text="t('common.close')">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" aria-lable="t('common.close')"
            icon="mdi-close"
            variant="text" size="small" @click="model = null"/>
          </template>
        </v-tooltip>
      </v-card-title>

      <v-card-text class="pa-6">

        <v-sheet border rounded="lg" class="pa-4 bg-grey-lighten-4">
          <v-row dense class="mb-2">
            <v-col cols="4" class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
              {{ t('common.description') }}
            </v-col>
            <v-col cols="8" class="text-body-2 font-weight-medium">
              {{ model.description }}
            </v-col>
          </v-row>

          <v-row dense class="mb-2">
            <v-col cols="4" class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
              {{ t('common.date') }}
            </v-col>
            <v-col cols="8" class="text-body-2">
              {{ formattedDisplayDate }}
            </v-col>
          </v-row>

          <v-row dense class="mb-2">
            <v-col cols="4" class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
              {{  t('common.type') }}
            </v-col>
            <v-col cols="8" class="text-body-2 font-weight-medium">
              {{ t(`common.${model.transaction_type}`) }}
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="4" class="text-caption text-uppercase font-weight-bold text-medium-emphasis">
              {{ t('common.amount') }}
            </v-col>
            <v-col cols="8">
              <Money :amount="model.amount" :type="model.transaction_type" class="text-body-1 font-weight-black" />
            </v-col>
          </v-row>
        </v-sheet>

      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 bg-grey-lighten-5">
        <v-btn
          variant="text"
          color="grey-darken-1"
          @click="model = null"
          :disabled="loading"
        >
          {{ t('common.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="error"
          variant="elevated"
          prepend-icon="mdi-trash-can-outline"
          :loading="loading"
          @click="deleteTransaction"
        >
          {{ t('deleteDialog.confirmBtn') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>