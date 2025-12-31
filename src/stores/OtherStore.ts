import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { defaultToastTimeout, appName } from "@/utils/SystemDefaults.ts";

interface OtherSettings {
  timeout: number;
}

export const useOtherStore = defineStore("storeOther", () => {
  const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
  const getKey = getStorageKey("Other");

  // 1. HYDRATION
  const savedOther = localStorage.getItem(getKey);
  let initialData: OtherSettings;

  if (savedOther) {
    try {
      initialData = JSON.parse(savedOther);
    } catch (e) {
      // DYNAMIC IMPORT: We load the logger on-the-fly here
      import("@/utils/Logger").then(m =>
        m.logException(e, { module: "Other", action: "Hydration", data: savedOther })
      );
      initialData = { timeout: defaultToastTimeout };
    }
  } else {
    initialData = { timeout: defaultToastTimeout };
  }

  // 2. STATE
  const currentTimeout = ref<number>(initialData.timeout);

  // 3. GETTERS
  const getTimeout = computed((): number => currentTimeout.value);

  // 4. ACTIONS
  async function setTimeout(newTimeout: number) {
    try {
      currentTimeout.value = newTimeout;

      const objOutput: OtherSettings = { timeout: currentTimeout.value };
      localStorage.setItem(getKey, JSON.stringify(objOutput));
    } catch (e) {
      // DYNAMIC IMPORT: Using await inside an async action is very clean
      const { logException } = await import("@/utils/Logger");
      logException(e, { module: "Other", action: "Save", data: newTimeout });
    }
  }

  return {
    currentTimeout,
    getTimeout,
    setTimeout,
  };
});