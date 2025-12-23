import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  NumberFormat,
  CurrencyDisplay,
  CurrencySign,
} from "@/types/CommonTypes.ts";
import {
  defaultCurrencyCode,
  defaultMinPrecision,
  defaultMaxPrecision,
  defaultThousandsSeparator,
  defaultUseBankersRounding,
  defaultNegativeZero,
  defaultCurrencyDisplay,
  defaultCurrencySign,
  appName
} from "@/utils/SystemDefaults.ts";

// 1. Define the storage interface to match your numberFormat computed
interface CurrencySettings {
  format: NumberFormat;
}

export const useCurrencyStore = defineStore("storeCurrency", () => {
  const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
  const getKey = getStorageKey("Currency");

  // 2. HYDRATION LOGIC: Try to load all settings at once
  const savedJSON = localStorage.getItem(getKey);
  let initial: NumberFormat;

  if (savedJSON) {
    try {
      const parsed = JSON.parse(savedJSON) as CurrencySettings;
      initial = parsed.format ?? {} as NumberFormat;
    } catch (e) {
      console.error("Failed to parse Currency storage", e);
      // Fallback object if parsing fails
      initial = {} as NumberFormat;
    }
  } else {
    initial = {} as NumberFormat;
  }

  // 3. Reactive state - Use saved value OR system default
  const minPrecision = ref<number | undefined>(initial.minPrecision ?? defaultMinPrecision);
  const maxPrecision = ref<number>(initial.maxPrecision ?? defaultMaxPrecision);
  const thousandsSeparator = ref<boolean>(initial.thousandsSeparator ?? defaultThousandsSeparator);
  const useBankersRounding = ref<boolean>(initial.useBankersRounding ?? defaultUseBankersRounding);
  const negativeZero = ref<boolean>(initial.negativeZero ?? defaultNegativeZero);
  const currency = ref<string>(initial.currency ?? defaultCurrencyCode);
  const currencyDisplay = ref<CurrencyDisplay>((initial.currencyDisplay ?? defaultCurrencyDisplay) as CurrencyDisplay);
  const currencySign = ref<CurrencySign>((initial.currencySign ?? defaultCurrencySign) as CurrencySign);

  // 4. Computed: Current number format object
  const numberFormat = computed<NumberFormat>(() => ({
    minPrecision: minPrecision.value,
    maxPrecision: maxPrecision.value,
    thousandsSeparator: thousandsSeparator.value,
    useBankersRounding: useBankersRounding.value,
    negativeZero: negativeZero.value,
    currency: currency.value,
    currencyDisplay: currencyDisplay.value,
    currencySign: currencySign.value,
  }));

  // 5. Action: Update and Sync
  function updateNumberFormat(payload: Partial<NumberFormat>) {
    if (payload.minPrecision !== undefined) minPrecision.value = payload.minPrecision;
    if (payload.maxPrecision !== undefined) maxPrecision.value = payload.maxPrecision;
    if (payload.thousandsSeparator !== undefined) thousandsSeparator.value = payload.thousandsSeparator;
    if (payload.useBankersRounding !== undefined) useBankersRounding.value = payload.useBankersRounding;
    if (payload.negativeZero !== undefined) negativeZero.value = payload.negativeZero;
    if (payload.currency !== undefined) currency.value = payload.currency;
    if (payload.currencyDisplay !== undefined) currencyDisplay.value = payload.currencyDisplay;
    if (payload.currencySign !== undefined) currencySign.value = payload.currencySign;

    // Save the entire resulting format object to localStorage
    const objOutput: CurrencySettings = { format: numberFormat.value };
    localStorage.setItem(getKey, JSON.stringify(objOutput));
  }

  return {
    minPrecision,
    maxPrecision,
    thousandsSeparator,
    useBankersRounding,
    negativeZero,
    currency,
    currencyDisplay,
    currencySign,
    numberFormat,
    updateNumberFormat,
  };
});