import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { defaultLocale, LocaleOption, appName } from "@/utils/SystemDefaults.ts";
import { localeList, type LocaleItem } from "@/utils/localeList.ts";
import { logException } from "@/utils/Logger";

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
      logException(e, { module: "Locale", action: "Read from localStorage", data: savedJSON});
      initialLocaleValue = defaultLocale;
    }
  } else {
    initialLocaleValue = defaultLocale;
  }

  // 2. STATE
  const currentLocale = ref(initialLocaleValue);

  // 3. COMPUTED & HELPERS
  const canonicalizeCode = (code: string): string => {
    if (!code) return "";
    const parts = code.split("-");
    if (parts.length > 1) {
      return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
    }
    return code.toLowerCase();
  }
  const availableLocales = ref<LocaleItem[]>(localeList);

  // 4. ACTIONS
  function updateLocale(newLocale: string) {
    try {
      const cleanCode = canonicalizeCode(newLocale);
      const exists = availableLocales.value.some(loc => loc.code === cleanCode);
      const finalValue = exists ? cleanCode : defaultLocale;

      currentLocale.value = finalValue;

      // Persist as a JSON object to match your other stores
      const objOutput: LocaleSettings = { locale: finalValue };
      localStorage.setItem(getKey, JSON.stringify(objOutput));
    } catch (e) {
      logException(e, { module: "Locale", action: "Update Locale", data: newLocale });
    }
  }

  return {
    currentLocale,
    availableLocales,
    updateLocale,
  };
});