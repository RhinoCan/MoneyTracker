// @/utils/localeList.ts
import { logException } from "@/lib/Logger";

// ESLint incorrectly flags the parameter name in this type definition as unused.
// TypeScript requires a name here syntactically; there is no valid workaround.
// eslint-disable-next-line no-unused-vars
type IntlWithSupportedValuesOf = typeof Intl & { supportedValuesOf: (type: string) => string[] };

/**
 * Curated list of base language codes we want to support in the UI.
 * This prevents the user from being overwhelmed by thousands of browser-supported variations.
 */
const SUPPORTED_LANGUAGE_CODES = [
  "en",
  "fr",
  "es",
  "de",
  "zh",
  "ja",
  "ko",
  "hi",
  "ar",
  "ru",
  "pt",
  "it",
];

export interface LocaleItem {
  code: string;
  name: string;
  englishName: string;
}

/**
 * Generates a list of locale objects containing the code, the localized name,
 * and the English name.
 * @param displayLocale - The language to use for the localized names in the list (defaults to 'en').
 * @returns Sorted array of LocaleItem objects.
 */
export function generateLocaleList(displayLocale: string = "en"): LocaleItem[] {
  let display: Intl.DisplayNames;
  let displayEnglish: Intl.DisplayNames;

  try {
    display = new Intl.DisplayNames([displayLocale], { type: "language" });
    displayEnglish = new Intl.DisplayNames(["en"], { type: "language" });
  } catch {
    return [{ code: "en-US", name: "English (US)", englishName: "English (US)" }];
  }

  let localeCodes: string[];

  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      localeCodes = (Intl as IntlWithSupportedValuesOf).supportedValuesOf("language");
    } else {
      throw new Error("Intl.supportedValuesOf not supported");
    }
  } catch (e) {
    if (!(e instanceof RangeError && e.message.includes("language"))) {
      logException(e, {
        module: "localeList",
        action: "generateLocaleList",
        slug: "localeList.intl_supported_values_failed",
      });
    }

    localeCodes = [
      "en-US",
      "en-CA",
      "en-GB",
      "fr-FR",
      "fr-CA",
      "fr-CH",
      "es-ES",
      "de-DE",
      "zh-CN",
      "ja-JP",
      "ko-KR",
      "hi-IN",
      "ar-SA",
      "ru-RU",
      "pt-BR",
      "it-IT",
    ];
  }

  const filteredCodes = localeCodes.filter((code) => {
    const baseLanguage = code.split("-")[0].toLowerCase();
    return SUPPORTED_LANGUAGE_CODES.includes(baseLanguage);
  });

  const items: LocaleItem[] = filteredCodes.map((code) => {
    try {
      const name = display.of(code) || code;
      const englishName = displayEnglish.of(code) || code;
      return { code, name, englishName };
    } catch {
      return { code, name: code, englishName: code };
    }
  });

  return items.sort((a, b) => a.name.localeCompare(b.name));
}