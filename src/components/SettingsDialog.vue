<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useSettingsStore, localeToCurrency } from "@/stores/SettingsStore";
import { generateLocaleList } from "@/utils/localeList";
import { useI18n } from "vue-i18n";
import { CurrencyCode, SupportedLocale } from "@/types/CommonTypes";
import { getCurrencyDisplayNames } from "@/utils/SystemDefaults";
import { useLocale } from 'vuetify';

const { current: vuetifyLocale } = useLocale();
const emit = defineEmits(["close"]);
const { t, locale } = useI18n();
const settingsStore = useSettingsStore();

// --- Local draft state ---
const localLocale = ref<SupportedLocale>(settingsStore.locale);
const localCurrency = ref<CurrencyCode>(settingsStore.currency);
const localTimeout = ref<number>(settingsStore.snackbarTimeout);

// --- Dropdown items ---
const locales = computed(() =>
  generateLocaleList(localLocale.value).map((loc) => ({
    label: loc.name,
    value: loc.code,
  }))
);

const supportedCurrencies: CurrencyCode[] = [
  "USD","CAD","GBP","EUR","CHF","CNY","JPY","KRW","INR","SAR","RUB","BRL"
];

const currencyItems = computed(() =>
  supportedCurrencies.map((code) => {
    const { english, local } = getCurrencyDisplayNames(code, localLocale.value);
    return { value: code, title: `${code} - ${english} - ${local}` };
  })
);

// --- Slider and switch ---
const isMessagePersistent = computed<boolean>({
  get: () => localTimeout.value === -1,
  set: (on) => {
    localTimeout.value = on ? -1 : 5; // default 5s when switching off
  }
});

const tickLabels = {
  1:"1", 2:"2", 3:"3", 4:"4", 5:"5", 6:"6", 7:"7", 8:"8", 9:"9", 10:"10"
};

// --- Save spinner ---
const savingSettings = ref(false);

// --- Handle Save ---
async function handleSave() {
  if (savingSettings.value) return; //guard against concurrent calls
  savingSettings.value = true;

  try {
    settingsStore.locale = localLocale.value;
    settingsStore.currency = localCurrency.value;
    settingsStore.snackbarTimeout = localTimeout.value;
    locale.value = localLocale.value; //triggers App.vue RTL watcher
    vuetifyLocale.value = localLocale.value;
    await settingsStore.saveToDb();
    emit("close");
  } catch (error) {
    // error logged by store; dialog remains open
  } finally {
    savingSettings.value = false;
  }
}

watch(localLocale, (newLocale) => {
  const defaultCurrency = localeToCurrency[newLocale];
  if (defaultCurrency) {
    localCurrency.value = defaultCurrency;
  }
});

</script>

<template>
  <v-card>
    <v-card-title class="bg-primary text-on-primary">
      {{ t("settings.title") }}
    </v-card-title>

    <v-card-text class="pt-4">
      <v-select
        v-model="localLocale"
        :items="locales"
        item-title="label"
        item-value="value"
        :label="t('settings.locale')"
        prepend-inner-icon="mdi-translate"
      />

      <v-select
        v-model="localCurrency"
        :items="currencyItems"
        item-title="title"
        item-value="value"
        :label="t('settings.currency')"
        prepend-inner-icon="mdi-currency-usd"
      />

      <!-- Persistent snackbar toggle -->
      <v-switch
        v-model="isMessagePersistent"
        :label="isMessagePersistent ? t('settings.persistMsg') : t('settings.timeoutMsg')"
        color="primary"
        prepend-icon="mdi-pin-outline"
      />

      <!-- Slider appears only when NOT persistent -->
      <v-expand-transition>
        <div v-if="!isMessagePersistent">
          <v-slider
            v-model="localTimeout"
            :min="0"
            :max="10"
            :step="1"
            :ticks="tickLabels"
            show-ticks="always"
            tick-size="4"
            prepend-icon="mdi-timer-outline"
            thumb-label
          >
            <template #append>
              <span class="text-caption">{{ localTimeout.toFixed(1) }} s</span>
            </template>
          </v-slider>
        </div>
      </v-expand-transition>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="emit('close')">{{ t("common.cancel") }}</v-btn>
      <v-btn
        color="primary"
        variant="elevated"
        @click="handleSave"
        :loading="savingSettings"
      >
        {{ t("common.saveChanges") }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
