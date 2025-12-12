<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useCurrencyStore } from "@/stores/CurrencyStore.ts";
import type { CurrencyDisplay, CurrencySign } from "@/types/CommonTypes.ts";

const emit = defineEmits(["saved", "cancel"]);

const currencyStore = useCurrencyStore();

// Local editable copies
const minPrecisionModel = ref<number | undefined>();
const maxPrecisionModel = ref<number>();
const thousandsSeparatorModel = ref<boolean>();
const useBankersRoundingModel = ref<boolean>();
const negativeZeroModel = ref<boolean>();
const currencyModel = ref<string>("");
const currencyDisplayModel = ref<CurrencyDisplay>("symbol");
const currencySignModel = ref<CurrencySign>("standard");

// When component opens, sync values from store
onMounted(() => {
  minPrecisionModel.value = currencyStore.minPrecision;
  maxPrecisionModel.value = currencyStore.maxPrecision;
  thousandsSeparatorModel.value = currencyStore.thousandsSeparator;
  useBankersRoundingModel.value = currencyStore.useBankersRounding;
  negativeZeroModel.value = currencyStore.negativeZero;
  currencyModel.value = currencyStore.currency;
  currencyDisplayModel.value = currencyStore.currencyDisplay;
  currencySignModel.value = currencyStore.currencySign;
});

// Save changes back to store
function saveChanges() {
  currencyStore.updateNumberFormat({
    minPrecision: minPrecisionModel.value,
    maxPrecision: maxPrecisionModel.value,
    thousandsSeparator: thousandsSeparatorModel.value,
    useBankersRounding: useBankersRoundingModel.value,
    negativeZero: negativeZeroModel.value,
    currency: currencyModel.value,
    currencyDisplay: currencyDisplayModel.value,
    currencySign: currencySignModel.value,
  });

  emit("saved");
}
</script>

<template>
  <v-card color="surface">
    <v-card-title class="bg-primary text-on-primary">Currency Settings</v-card-title>

    <v-card-text>

        <v-row dense>
          <v-col cols="6">
            <v-text-field
              type="number"
              label="Min Precision"
              variant="outlined"
              v-model.number="minPrecisionModel"
            />
          </v-col>

          <v-col cols="6">
            <v-text-field
              type="number"
              label="Max Precision"
              variant="outlined"
              v-model.number="maxPrecisionModel"
            />
          </v-col>

          <v-col cols="12">
            <v-text-field
              label="Currency Code (e.g. USD)"
              variant="outlined"
              v-model="currencyModel"
            />
          </v-col>

          <v-col cols="12">
            <v-select
              label="Currency Display"
              variant="outlined"
              :items="['symbol', 'narrowSymbol', 'code', 'name']"
              v-model="currencyDisplayModel"
            />
          </v-col>

          <v-col cols="12">
            <v-select
              label="Currency Sign"
              variant="outlined"
              :items="['standard', 'accounting']"
              v-model="currencySignModel"
            />
          </v-col>

          <v-col cols="12">
            <v-switch
              label="Use Thousands Separator"
              v-model="thousandsSeparatorModel"
            />
            <v-switch
              label="Use Banker's Rounding"
              v-model="useBankersRoundingModel"
            />
            <v-switch
              label="Show Negative Zero as '-0'"
              v-model="negativeZeroModel"
            />
          </v-col>
        </v-row>

    </v-card-text>

    <v-card-actions>
      <v-btn color="secondary" variant="outlined" @click="emit('cancel')">Cancel</v-btn>
      <v-btn color="primary" variant="elevated" @click="saveChanges">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>
