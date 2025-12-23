import { defineStore } from "pinia";
import { ref } from "vue";
import { defaultCountry } from "@/utils/SystemDefaults.ts";
import { determineDateFormatFromCountry } from "@/utils/dateFormatMapper.ts";
import { DateFormatTemplate } from "@/types/CommonTypes";
import { appName } from "@/utils/SystemDefaults.ts";

interface DateFormatSettings {
  dateFormat: string;
}

export const useDateFormatStore = defineStore("storeDateFormat", () => {
  //See if there are any Locale settings in localStorage
  const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
  const getKey = getStorageKey("DateFormat");

  const savedDateFormat = localStorage.getItem(getKey);
  let initialValue: string;

  //If there are saved values for settings used by this store, use them to set the current values of those settings.
  //Otherwise, use default values obtained from elsewhere in this app.
  if (savedDateFormat) {
    const parsed = JSON.parse(savedDateFormat) as DateFormatSettings;
    initialValue = parsed.dateFormat;
  } else {
    initialValue =
      determineDateFormatFromCountry(defaultCountry) ?? DateFormatTemplate.ISO;
  }

  const currentDateFormat = ref<DateFormatTemplate>(
    initialValue as DateFormatTemplate
  );

  function setDateFormat(newDateFormat: DateFormatTemplate) {
    currentDateFormat.value = newDateFormat;

    const objOutput: DateFormatSettings = { dateFormat: newDateFormat };
    localStorage.setItem(getKey, JSON.stringify(objOutput));
  }

  return {
    currentDateFormat, //state
    setDateFormat, //action
  };
});
