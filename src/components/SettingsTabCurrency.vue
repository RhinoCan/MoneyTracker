<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import { useCurrencyStore } from "@/stores/CurrencyStore";
import { CurrencyDisplay, CurrencySign } from "@/types/CommonTypes";
import InfoIcon from "@/components/InfoIcon.vue";

const currencyStore = useCurrencyStore();

const formValid = ref(true); //Default to true if no rules exist yet

// 1. Create the buffer using the correct properties from your interface
const localFormat = reactive({ ...currencyStore.numberFormat });

// 2. Options matching your exported types
const displayOptions: { title: string; value: CurrencyDisplay }[] = [
  { title: "Symbol ($)", value: "symbol" },
  { title: "Narrow Symbol ($)", value: "narrowSymbol" },
  { title: "Currency Code (USD)", value: "code" },
  { title: "Full Name (US dollars)", value: "name" },
];

const signOptions: { title: string; value: CurrencySign }[] = [
  { title: "Standard (-$1.00)", value: "standard" },
  { title: "Accounting (($1.00))", value: "accounting" },
];

// 3. Updated Preview using your actual properties
const previewAmount = computed(() => {
  const sample = -1234560.789;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: localFormat.currency,
      currencyDisplay: localFormat.currencyDisplay,
      currencySign: localFormat.currencySign,
      minimumFractionDigits: localFormat.minPrecision || 0,
      maximumFractionDigits: localFormat.maxPrecision,
      useGrouping: localFormat.thousandsSeparator,
    }).format(sample);
  } catch (e) {
    return "Invalid Format";
  }
});

 const tickLabels = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
  }
function saveChanges() {
  // Pass the buffered object back to the store
  currencyStore.updateNumberFormat({ ...localFormat });
}

defineExpose({
  saveChanges,
  get isValid() {
    return formValid.value;
  }
});
</script>

<template>
  <v-form v-model="formValid">
    <v-container>
      <p>
        These are the current values that control the appearance of money
        amounts in this app. If you would like to have money amounts appear
        differently, change any of the values below. The preview will show you
        the effect of the change(s) you have made. The appearance of money
        amounts will change in the rest of the app when you click the
        <strong>Save Changes</strong> button.
      </p>

      <v-card color="secondary" variant="tonal" class="mt-4 mb-6">
        <v-card-text class="text-center">
          <div class="text-caption text-uppercase">
            Preview (Negative Example)
          </div>
          <div class="text-h4 font-weight-bold">{{ previewAmount }}</div>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" sm="6">
          <v-slider
            v-model="localFormat.minPrecision"
            label="Min Decimals"
            min="0"
            :max="4"
            step="1"
            thumb-label
            show-ticks="always"
            :ticks="tickLabels"
            :rules="[v => v <= localFormat.maxPrecision || 'Minimum precision cannot exceed maximum precision']"
          />
        </v-col>
        <v-col cols="12" sm="6">
          <v-slider
            v-model="localFormat.maxPrecision"
            label="Max Decimals"
            min="0"
            max="4"
            step="1"
            thumb-label
            show-ticks="always"
            :ticks="tickLabels"
            :rules="[v => v >= (localFormat.minPrecision ?? 0) || 'Maximum precision cannot be less than minimum precision']"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-select
            v-model="localFormat.currencyDisplay"
            label="Currency Display"
            :items="displayOptions"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" sm="6">
          <v-select
            v-model="localFormat.currencySign"
            label="Negative Sign Style"
            :items="signOptions"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12">
          <v-switch
            v-model="localFormat.thousandsSeparator"
            label="Use Thousands Separator"
            color="primary"
            hide-details
          />
          <v-switch
            v-model="localFormat.useBankersRounding"
            color="primary"
          >
            <template v-slot:label>
              Use Banker's Rounding
              <InfoIcon
                title="Banker's Rounding"
                text="Rounds to the nearest even number for .5 cases to reduce statistical bias."
              />
            </template>
          </v-switch>
        </v-col>
      </v-row>
    </v-container>
  </v-form>
</template>
