<script setup lang="ts">
import { Ref, ref, computed, watch } from "vue";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { useCurrencyFormatter } from "@/composables/useCurrencyFormatter.ts";
import { useDateFormatter } from "@/composables/useDateFormatter.ts";
import { useAppValidationRules } from "@/composables/useAppValidationRules";
import { useTransactionFormFields } from "@/composables/useTransactionFormFields";
import type { VTextField } from "vuetify/components";
import { Transaction } from "@/types/Transaction.ts";
import { SubmitEventPromise } from "vuetify";
import { parseISO, formatISO } from "date-fns";
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog.vue";
import { useLocaleStore } from "@/stores/LocaleStore"


const storeTransaction = useTransactionStore();
const localeStore = useLocaleStore();
const { displayMoney } = useCurrencyFormatter();
const { required, transactionTypeRequired, dateRangeRule, amountValidations } =
  useAppValidationRules(localeStore.currentLocale);

const showKeyboardShortcuts = ref(false);

// The component's v-model prop (The full Transaction object)
const model = defineModel<Transaction | null>();

const amountFieldRef = ref<VTextField | null>(null);

const { formatDate } = useDateFormatter();

// Writable Computed Property to handle display formatting (get) and raw data updates (set)
const dateDisplayModel = computed({
  // GETTER: Formats the ISO string (YYYY-MM-DD) for display in the text field
  get() {
    const isoDate = localTransaction.value?.date;
    if (!isoDate) {
      return "";
    }
    // Use your new reactive formatter!
    return formatDate(isoDate);
  },

  // SETTER: This is called when the date picker changes the v-model on the date picker
  set(newValue: string) {
    // We update the localTransaction copy's date property.
    if (localTransaction.value) {
      localTransaction.value.date = newValue;
    }
  },
});

// Add this in UpdateTransaction.vue's script setup:
const rawDateForValidation = computed(() => {
  const dateValue = localTransaction.value?.date;
  if (!dateValue) return null;
  let dateObject: Date;
  if (typeof dateValue === "string") {
    dateObject = parseISO(dateValue);
  } else {
    dateObject = dateValue as Date;
  }

  //Always return the clean ISO string (YYYY-MM-DD).
  return formatISO(dateObject, { representation: "date" });
});

const dateError = ref<string | null>(null);

// CRITICAL FIX: Local ref to hold a DEEP COPY of the transaction for editing.
// This prevents direct mutation of the store's data until Update is pressed.
const localTransaction = ref<Transaction | null>(null);

const {
  displayAmount,
  isFocused,
  colorClass,
  handleFocus,
  handleBlur,
  dateMenu,
  closeDatePicker,
} = useTransactionFormFields(localTransaction);

// ------------------------------------
// Initialization Watcher - Creates a Deep Copy
// ------------------------------------
watch(
  model,
  (newModel) => {
    if (newModel) {
      // Create a deep copy to edit the local data.
      localTransaction.value = JSON.parse(JSON.stringify(newModel));

      dateError.value = null;

      // CHECK ADDED: Only proceed if the copy was successfully created
      if (localTransaction.value) {
        // Initialize the display field with the formatted currency string from the copy
        displayAmount.value = displayMoney(localTransaction.value.amount);
      }
    } else {
      // Clear local state when the dialog closes
      localTransaction.value = null;
      displayAmount.value = "";
      isFocused.value = false;
    }
  },
  { immediate: true }
);

// ------------------------------------
// Validation Rules
// ------------------------------------
const rules = {
  required,
  descriptionRequired: required,
  dateRequired: dateRangeRule,
  transactionTypeRequired: transactionTypeRequired,
  amountValidations: amountValidations,
};

function closeDialog() {
  // Setting the model to null closes the dialog.
  // If we press Cancel, the localTransaction copy is simply abandoned.
  const modelRef = model as Ref<Transaction | null>;
  modelRef.value = null;
}

async function onSubmit(event: SubmitEventPromise) {
  handleBlur();

  dateError.value = null;

  //Manual validation of date
  if (!localTransaction.value || !localTransaction.value.date) {
    console.error("Missing local transaction or date on submit");
  }

  const dateValue = localTransaction.value!.date;

  let dateObject: Date;

  //Check the actual type of the date field.
  if (typeof dateValue === "string") {
    dateObject = parseISO(dateValue);
  } else {
    dateObject = dateValue as Date;
  }

  const cleanIsoDate = formatISO(dateObject, { representation: "date" });

  const validationResult = rules.dateRequired(cleanIsoDate);

  if (validationResult !== true) {
    //Validation failed. Capture the error and stop submission.
    dateError.value = validationResult as string;
    return;
  }

  const { valid } = await event;
  if (!valid || !localTransaction.value) return;

  // Only update the store's data with the local copy when the user confirms
  storeTransaction.updateTransaction(localTransaction.value);

  closeDialog();
}
</script>

<template>
  <v-dialog
    v-if="localTransaction"
    :model-value="!!model"
    @update:model-value="closeDialog"
    max-width="500"
  >
    <template #default>
      <v-card color="surface" variant="elevated" class="mx-auto">
        <v-card-title class="bg-primary text-on-primary"
          >Update Transaction
          <v-btn
            icon="mdi-help"
            variant="text"
            color="white"
            aria-label="Help"
            position="absolute"
            style="top: 0px; right: 48px"
            @click="showKeyboardShortcuts = true"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            aria-label="Close dialog"
            position="absolute"
            style="top: 0px; right: 8px"
            @click="closeDialog"
          ></v-btn>
        </v-card-title>
        <v-form @submit.prevent="onSubmit">
          <v-card-text>
            <p class="mb-4">
              Change any part of the transaction you like, apart from the key
              (which is the ID):
            </p>
            <v-row dense>
              <v-col cols="3">
                <v-text-field
                  label="Id"
                  disabled
                  :model-value="localTransaction?.id"
                  variant="outlined"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  label="Description"
                  v-model="localTransaction!.description"
                  variant="outlined"
                  :rules="[rules.descriptionRequired]"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-menu
                  v-model="dateMenu"
                  :close-on-content-click="false"
                  location="bottom center"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      label="Transaction Date"
                      v-model="dateDisplayModel"
                      variant="outlined"
                      readonly
                      v-bind="props"
                      validate-on="input"
                      :key="localTransaction?.date || ''"
                      :rules="[rules.required]"
                      class="mt-2"
                      prepend-inner-icon="mdi-calendar"
                      :error-messages="dateError"
                    />
                  </template>

                  <v-date-picker
                    v-model="dateDisplayModel"
                    @update:model-value="closeDatePicker"
                    color="primary"
                  ></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>

            <v-row dense>
              <v-col cols="6">
                <v-radio-group
                  v-model="localTransaction!.transactionType"
                  inline
                  label="Transaction Type"
                >
                  <v-radio label="Income" value="Income" />
                  <v-radio label="Expense" value="Expense" />
                </v-radio-group>
              </v-col>

              <v-col cols="6">
                <v-text-field
                  label="Amount"
                  v-model="displayAmount"
                  variant="outlined"
                  type="text"
                  :class="[isFocused ? '' : colorClass, 'money-field']"
                  :readonly="!isFocused && !!displayAmount"
                  @focus="handleFocus"
                  @blur="handleBlur"
                  :rules="[rules.amountValidations]"
                  placeholder="0.00"
                  style="cursor: pointer"
                  ref="amountFieldRef"
                />
              </v-col>
            </v-row>
            <p>
              Press the UPDATE TRANSACTION button to update the transaction with
              the values you have changed. Press the CANCEL button to quit the
              update.
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              text="Cancel"
              variant="outlined"
              elevated="16"
              color="secondary"
              class="mr-2"
              @click="closeDialog"
            ></v-btn>
            <v-btn
              text="Update Transaction"
              variant="elevated"
              elevated="8"
              color="primary"
              type="submit"
            ></v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </template>
  </v-dialog>
    <!--KEYBOARD SHORTCUTS DIALOG-->
    <v-dialog v-model="showKeyboardShortcuts" max-width="300">
      <KeyboardShortcutsDialog @close="showKeyboardShortcuts = false" />
    </v-dialog>
</template>

<style scoped>
/* 1. Base style for the input element (font size) */
.money-field :deep(.v-field__input) {
  font-size: 20px !important; /* Force larger font size */
  letter-spacing: 1px;
  padding-top: 5px;
}

/* 2. Color classes: We use the dynamic class (money-plus/minus) on the outer component
      to style the inner input element. */
.money-field.money-plus :deep(.v-field__input) {
  color: #2ecc71 !important; /* Green */
}

.money-field.money-minus :deep(.v-field__input) {
  color: #c0392b !important; /* Red */
}
</style>
