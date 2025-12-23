import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { defaultLocale, LocaleOption, appName } from "@/utils/SystemDefaults.ts";
import { localeList } from "@/utils/localeList.ts";

interface LocaleSettings {
  locale: string;
}

export const useLocaleStore = defineStore("storeLocale", () => {
  const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
  const getKey = getStorageKey("Locale");

  // 1. HYDRATION LOGIC
  const savedJSON = localStorage.getItem(getKey);
  let initialLocaleValue: string;

  if (savedJSON) {
    try {
      const parsed = JSON.parse(savedJSON) as LocaleSettings;
      initialLocaleValue = parsed.locale;
    } catch (e) {
      console.error("Failed to parse Locale storage, falling back to default", e);
      initialLocaleValue = defaultLocale;
    }
  } else {
    initialLocaleValue = defaultLocale;
  }

  // 2. STATE
  const currentLocale = ref(initialLocaleValue);
  const isLocaleReady = ref(!!savedJSON); // Ready if we loaded from disk, otherwise false until updated

  // 3. COMPUTED & HELPERS
  const availableLocales = ref<LocaleOption[]>(
    localeList.map((item) => ({
      code: item.code,
      label: (item as any).name,
    }))
  );

  const currentLocaleOption = computed<LocaleOption | undefined>(() => {
    const canonicalizeCode = (code: string): string => {
      const parts = code.split("-");
      if (parts.length > 1) {
        return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
      }
      return code.toLowerCase();
    };

    const lookupCode = canonicalizeCode(currentLocale.value);
    return availableLocales.value.find((loc) => loc.code === lookupCode);
  });

  // 4. ACTIONS
  function updateLocale(newLocale: string) {
    currentLocale.value = newLocale;
    isLocaleReady.value = true;

    // Persist as a JSON object to match your other stores
    const objOutput: LocaleSettings = { locale: newLocale };
    localStorage.setItem(getKey, JSON.stringify(objOutput));
  }

  return {
    currentLocale,
    isLocaleReady,
    currentLocaleOption,
    availableLocales,
    updateLocale,
  };
});