import { defineStore } from "pinia";
import { ref } from "vue";
import { defaultCountry } from "@/utils/SystemDefaults.ts";
import { determineDateFormatFromCountry } from "@/utils/dateFormatMapper.ts";
import { DateFormatTemplate } from "@/types/CommonTypes";
import { appName } from "@/utils/SystemDefaults.ts";
import { logException, logInfo } from "@/utils/Logger";

interface DateFormatSettings {
  dateFormat: string;
}

export const useDateFormatStore = defineStore("storeDateFormat", () => {
  //See if there are any Locale settings in localStorage
  const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
  const getKey = getStorageKey("DateFormat");

  const savedDateFormat = localStorage.getItem(getKey);
  let initialValue: string;

  const getFallbackFormat = (): string => {
    try {
      return determineDateFormatFromCountry(defaultCountry) ?? DateFormatTemplate.ISO;
    } catch (e) {
      logException(e, { module: "DateFormat", action: "Determine fallback date format", data: defaultCountry });
      return DateFormatTemplate.ISO;
    }
  };

  //If there are saved values for settings used by this store, use them to set the current values of those settings.
  //Otherwise, use default values obtained from elsewhere in this app.
  if (savedDateFormat) {
    try {
      const parsed = JSON.parse(savedDateFormat) as DateFormatSettings;
      if (parsed.dateFormat === undefined || parsed.dateFormat === null) {
        logInfo("There was no saved date format; initializing with a default. The date format can be changed in the Settings dialog.", { module: "DateFormat", action: "Initialize date format (1)" });
      }
      initialValue = parsed.dateFormat ?? getFallbackFormat();
    } catch (e) {
      logException(e, { module: "DateFormat", action: "Read from localStorage", data: savedDateFormat });
      initialValue = getFallbackFormat();
      logInfo("There was no saved date format; initializing with a default. The date format can be changed in the Settings dialog.", { module: "DateFormat", action: "Initialize date format (2)" });

    }
  } else {
    initialValue = getFallbackFormat();
    logInfo("There was no saved date format; initializing with a default. The date format can be changed in the Settings dialog.", { module: "DateFormat", action: "Initialize date format (3)" });
  }

  const currentDateFormat = ref<DateFormatTemplate>(
    initialValue as DateFormatTemplate
  );

  function setDateFormat(newDateFormat: DateFormatTemplate) {
    try {
    currentDateFormat.value = newDateFormat;

    const objOutput: DateFormatSettings = { dateFormat: newDateFormat };
    localStorage.setItem(getKey, JSON.stringify(objOutput));
    } catch (e) {
      logException(e, { module: "DateFormat", action: "update", data: newDateFormat});
    }
  }

  return {
    currentDateFormat, //state
    setDateFormat, //action
  };
});
