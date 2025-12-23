import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { defaultToastTimeout } from "@/utils/SystemDefaults.ts";
import { appName } from '@/utils/SystemDefaults.ts';

/* The Basic Model of a Store

  Whenever the user changes a value of a setting to one that he prefers to the value that it would otherwise have,
  it should be saved, either to localStorage or an external store like Firebase. Therefore, when initializing the
  store, the store needs to look at localStorage to see if a saved value exists: if it does, it should take effect
  immediately and be used until the user changes it. If there is no saved value, a default value should be found
  or generated. In other words, a current value of a setting is determined and used based on either the saved value
  (if there is one) or a default. If the user changes the value of that setting, then that should be written to
  local or external storage.

  NOTE: JSON.parse() converts a String representation of an Object as an Object and a String representation of
  an Array as an Array. If the Other store contained only a timeout value, it would presumably be represented as
  an object like this: {"timeout": 3000}
*/

interface OtherSettings {
  timeout: number;
}

export const useOtherStore = defineStore("storeOther", () => {
  //See if there are any "other" settings in localStorage
  const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
  const getKey = getStorageKey("Other");

  const savedOther = localStorage.getItem(getKey);

  //If there are saved values for settings used by this store, use them to set the current values of those settings.
  //Otherwise, use default values obtained from elsewhere in this app.
  const initialData: OtherSettings = savedOther ? JSON.parse(savedOther) : { timeout: defaultToastTimeout };

  const currentTimeout = ref<number>(initialData.timeout);

  const getTimeout = computed((): number => currentTimeout.value);

  function setTimeout(newTimeout: number) {
    currentTimeout.value = newTimeout;
    //write object containing "other" values to localStorage; previous values for this store will be overwritten
    const objOutput: OtherSettings = {
      timeout: currentTimeout.value
    }
  localStorage.setItem(getKey, JSON.stringify(objOutput));
  }

  return {
    currentTimeout,
    getTimeout,
    setTimeout,
  };
});
