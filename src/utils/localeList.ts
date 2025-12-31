import { logException } from "@/utils/Logger";

// 1. RESTORED: This must stay here for LocaleStore to use!
export interface LocaleItem {
  code: string;
  name: string;
}

export function generateLocaleList(): LocaleItem[] {
  // Safe setup for the DisplayNames API
  let display: Intl.DisplayNames;
  try {
    display = new Intl.DisplayNames(["en"], { type: "language" });
  } catch (e) {
    // If the browser is extremely old, provide a minimal fallback immediately
    return [{ code: "en-US", name: "English (US)" }];
  }

  let localeCodes: string[] = [];

  try {
    // Some environments (like older Node/JSDOM) throw on "language"
    // but work on "calendar". We can check existence first.
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      // @ts-ignore
       localeCodes = Intl.supportedValuesOf("language");
    } else {
       throw new Error("API not supported");
    }
  } catch (e) {
    // Only log if it's NOT a RangeError about the key "language"
    if (!(e instanceof RangeError && e.message.includes('language'))) {
       logException(e, {
         module: "localeList",
         action: "generateLocaleList.supportedValues",
       });
    }

    localeCodes = [
      "en-US",
      "en-CA",
      "fr-CA",
      "en-GB",
      "fr-CH",
      "fr-FR",
      "es-ES",
      "de-DE",
      "zh-CN",
      "ja-JP",
      "ko-KR",
      "hi-IN",
      "ar-SA",
      "ru-RU",
    ];
  }

  const items: LocaleItem[] = localeCodes.map((code) => {
    try {
      const name = display.of(code) || code;
      return { code, name };
    } catch {
      return { code, name: code }; // Last resort: use the code as the name
    }
  });

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

// 2. RESTORED: The constant used by the store
export const localeList: LocaleItem[] = generateLocaleList();
