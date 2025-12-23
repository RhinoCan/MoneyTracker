<script setup lang="ts">
import { ref, computed } from "vue";
import { useLocaleStore } from "@/stores/LocaleStore.ts";

const localeStore = useLocaleStore();

// Initialize the buffer directly
const selectedLocale = ref(localeStore.currentLocale);

const locales = computed(() =>
  localeStore.availableLocales.map((loc) => ({
    label: loc.label,
    value: loc.code,
  }))
);

function saveChanges() {
  localeStore.updateLocale(selectedLocale.value);
}

defineExpose({ saveChanges });
</script>

<template>
  <v-form @submit.prevent>
    <v-container>
      <p>
        This is the current value of the locale. If you would like to have a
        different locale, choose one of the values in the drop-down. The locale
        will change when you click the <strong>Save Changes</strong> button.
      </p>
      <v-select class="mt-6 mb-4"
        label="Locale"
        :items="locales"
        v-model="selectedLocale"
        variant="outlined"
        item-title="label"
        item-value="value"
      />
    </v-container>
  </v-form>
</template>
