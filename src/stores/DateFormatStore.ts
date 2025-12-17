import { defineStore } from "pinia";
import { ref } from "vue";
import { defaultCountry } from "@/utils/SystemDefaults.ts";
import { determineDateFormatFromCountry } from "@/utils/dateFormatMapper.ts";
import { DateFormatTemplate } from "@/types/CommonTypes";

export const useDateFormatStore = defineStore("storeDateFormat", () => {
  //See if there is already a date format preference in local storage.
  const PERSISTENCE_KEY = "dateFormatPreference";
  const persistedDateFormat = localStorage.getItem(PERSISTENCE_KEY);

  // Initialize with the system-derived default country
  const defaultDateFormat = determineDateFormatFromCountry(defaultCountry);

  //Set the initial reactive state of the date format.
  const initialDateFormat =
    persistedDateFormat || defaultDateFormat || DateFormatTemplate.ISO;

  const activeDateFormat = ref<DateFormatTemplate>(
    initialDateFormat as DateFormatTemplate
  );

  function setDateFormat(newDateFormat: DateFormatTemplate) {
    activeDateFormat.value = newDateFormat;
    localStorage.setItem(PERSISTENCE_KEY, newDateFormat);
  }

  return {
    activeDateFormat, //state
    setDateFormat, //action
  };
});
