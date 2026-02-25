<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";
import { Transaction } from "@/types/Transaction";
import { SubmitEventPromise } from "vuetify";
import KeyboardShortcuts from "@/components/KeyboardShortcuts.vue";
import { logException, logValidation, logSuccess } from "@/lib/Logger";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const storeTransaction = useTransactionStore();
const { displayMoney } = useCurrencyFormatter();
const { formatForUI, toISODateString } = useDateFormatter();
const { required, dateRules, amountRules } = useAppValidationRules();
const { amountPlaceholder, amountExample, hasCorrectSeparator, decimalSeparator } =
  useNumberFormatHints();

const showKeyboardShortcuts = ref(false);

// The component's v-model prop
const model = defineModel<Transaction | null>();

// Local copy of transaction for editing
const localTransaction = ref<Transaction | null>(null);

// Date picker needs a Date object
const pickerDate = ref<Date>(new Date());

const { displayAmount, isFocused, colorClass, handleFocus, handleBlur, dateMenu, closeDatePicker } =
  useTransactionFormFields(localTransaction);

// Amount format hint
const amountHint = computed(() => {
  if (!isFocused.value || !displayAmount.value) {
    return t("common.format", { example: amountExample.value });
  }

  if (!hasCorrectSeparator(displayAmount.value)) {
    return t("common.wrongSeparator", { separator: decimalSeparator.value });
  }

  return t("common.format", { example: amountExample.value });
});

/**
 * 1. INITIALIZATION
 * Clones the incoming transaction to avoid mutating the list entry directly.
 */
watch(
  model,
  (newModel) => {
    if (newModel) {
      // Deep clone to isolate local edits
      const cloned = JSON.parse(JSON.stringify(newModel));

      // Ensure date is in YYYY-MM-DD format (source of truth)
      if (cloned.date && typeof cloned.date === "string") {
        const datePart = cloned.date.substring(0, 10); // Get YYYY-MM-DD part
        cloned.date = datePart;

        // Set picker date
        const [year, month, day] = datePart.split("-").map(Number);
        pickerDate.value = new Date(year, month - 1, day);
      }

      localTransaction.value = cloned;
      if (localTransaction.value) {
        displayAmount.value = displayMoney.value(localTransaction.value.amount);
      }
    }
  },
  { immediate: true }
);

function closeDialog() {
  model.value = null;
}

// Handle date selection from picker
function onDateSelected(date: Date | Date[] | null) {
  if (!date || Array.isArray(date) || !localTransaction.value) return;

  // Update the source of truth (YYYY-MM-DD string)
  localTransaction.value.date = toISODateString(date);
  pickerDate.value = date;

  closeDatePicker();
}

/**
 * 2. SUBMISSION LOGIC
 * Calculates a 'diff' so we only send updated fields to the database.
 */
async function onSubmit(event: SubmitEventPromise) {
  handleBlur();
  const { valid } = await event;
  if (!valid || !localTransaction.value || !model.value) {
    logValidation(t("common.invalidAmount"), {
      module: "UpdateTransaction",
      action: "onSubmit",
    });
    return;
  }

  const changes: Partial<Transaction> = {};

  // Compare standard fields
  if (localTransaction.value.description !== model.value.description) {
    changes.description = localTransaction.value.description;
  }
  if (localTransaction.value.transaction_type !== model.value.transaction_type) {
    changes.transaction_type = localTransaction.value.transaction_type;
  }
  if (localTransaction.value.amount !== model.value.amount) {
    changes.amount = localTransaction.value.amount;
  }

  // Date comparison - both should now be YYYY-MM-DD strings
  const normalizeDate = (val: string | Date | null): string => {
    if (!val) return "";
    if (typeof val === "string") {
      return val.substring(0, 10); // Ensure YYYY-MM-DD
    }
    return toISODateString(val instanceof Date ? val : new Date(val));
  };

  const localDate = normalizeDate(localTransaction.value.date);
  const originalDate = normalizeDate(model.value.date);

  if (localDate !== originalDate) {
    changes.date = localDate;
  }

  // 3. Change Detection Guard
  if (Object.keys(changes).length === 0) {
    storeTransaction.error = t("updateDialog.noChanges");
    closeDialog();
    return;
  }

  try {
    await storeTransaction.updateTransaction(localTransaction.value.id, changes);

    logSuccess(t("updateDialog.success"), {
      module: "UpdateTransaction",
      action: "onSubmit",
      data: {
        id: localTransaction.value.id,
        updatedFields: Object.keys(changes),
      },
    });

    closeDialog();
  } catch {
    logException(new Error("Update failed in the UI."), {
      module: "UpdateTransaction",
      action: "onSubmit",
      slug: t("updateDialog.failedUI"),
    });
  }
}
</script>

<template>
  <v-dialog
    v-if="localTransaction"
    :model-value="!!model"
    @update:model-value="closeDialog"
    max-width="500"
    persistent
  >
    <v-card color="surface" elevation="12" class="rounded-lg">
      <v-card-title class="bg-primary text-on-primary d-flex align-center pr-2">
        <v-icon start icon="mdi-pencil-box-outline" />
        {{ t("updateDialog.title") }}
        <v-spacer />
        <v-tooltip :text="t('common.help')">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              :aria-label="t('common.help')"
              icon="mdi-help"
              variant="text"
              size="small"
              @click="showKeyboardShortcuts = true"
            />
          </template>
        </v-tooltip>
        <v-tooltip :text="t('common.close')">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              aria-lable="t('common.close')"
              icon="mdi-close"
              variant="text"
              size="small"
              @click="closeDialog"
            />
          </template>
        </v-tooltip>
      </v-card-title>

      <v-form @submit.prevent="onSubmit">
        <v-card-text class="pt-6">
          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model="localTransaction.description"
                :label="t('common.description')"
                variant="outlined"
                :rules="[required]"
              />
            </v-col>

            <v-col cols="6">
              <v-menu
                v-model="dateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                location="bottom center"
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :label="t('common.date')"
                    :model-value="formatForUI(localTransaction.date)"
                    variant="outlined"
                    readonly
                    prepend-inner-icon="mdi-calendar"
                    :rules="[(v) => dateRules(localTransaction!.date)]"
                  />
                </template>
                <v-date-picker
                  v-model="pickerDate"
                  @update:model-value="onDateSelected"
                  color="primary"
                />
              </v-menu>
            </v-col>
          </v-row>

          <v-row dense class="align-center">
            <v-col cols="6">
              <v-radio-group
                v-model="localTransaction!.transaction_type"
                inline
                :label="t('common.type')"
                hide-details
              >
                <v-radio :label="t('common.Income')" value="Income" color="success" />
                <v-radio :label="t('common.Expense')" value="Expense" color="error" />
              </v-radio-group>
            </v-col>

            <v-col cols="6">
              <v-text-field
                v-model="displayAmount"
                :label="t('common.amount')"
                :placeholder="amountPlaceholder"
                :hint="amountHint"
                persistent-hint
                variant="outlined"
                :class="[isFocused ? '' : colorClass, 'money-field']"
                :readonly="!isFocused && !!displayAmount"
                @focus="handleFocus"
                @blur="handleBlur"
                :rules="[amountRules]"
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn :text="t('common.cancel')" variant="text" color="secondary" @click="closeDialog" />
          <v-spacer />
          <v-btn
            :text="t('updateDialog.btnUpdate')"
            variant="elevated"
            color="primary"
            type="submit"
            prepend-icon="mdi-check"
          />
        </v-card-actions>
      </v-form>
    </v-card>

    <v-dialog v-model="showKeyboardShortcuts" max-width="350">
      <KeyboardShortcuts
        v-if="showKeyboardShortcuts"
        @close="showKeyboardShortcuts = false"
      />
    </v-dialog>
  </v-dialog>
</template>

<style scoped>
.money-field :deep(.v-field__input) {
  font-size: 1.25rem !important;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.money-field.money-plus :deep(.v-field__input) {
  color: #2ecc71 !important;
}
.money-field.money-minus :deep(.v-field__input) {
  color: #e74c3c !important;
}
</style>
