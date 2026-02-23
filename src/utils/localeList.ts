// @/utils/localeList.ts
import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

const t = (i18n.global as any).t;

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
  "it"
];

export interface LocaleItem {
  code: string;
  name: string;
}

/**
 * Generates a list of locale objects containing the code and the localized name.
 * * @param displayLocale - The language to use for the names in the list (defaults to 'en').
 * @returns Sorted array of LocaleItem objects.
 */
export function generateLocaleList(displayLocale: string = "en"): LocaleItem[] {
  let display: Intl.DisplayNames;

  try {
    display = new Intl.DisplayNames([displayLocale], { type: "language" });
  } catch (e) {
    // Fallback for extremely restrictive environments
    return [{ code: "en-US", name: "English (US)" }];
  }

  let localeCodes: string[] = [];

  try {
    // Modern way to get browser-supported locales
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      // Use cast instead of @ts-ignore for better type safety
      localeCodes = (Intl as any).supportedValuesOf("language");
    } else {
      throw new Error("Intl.supportedValuesOf not supported");
    }
  } catch (e) {
    // We only log if it's a serious failure, not a known RangeError in specific environments
    if (!(e instanceof RangeError && e.message.includes("language"))) {
      logException(e, {
        module: "localeList",
        action: "generateLocaleList",
        slug: t("localeList.intl_supported_values_failed"),
      });
    }

    // Hard-coded fallback list
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
      "it-IT"
    ];
  }

  // Filter the list down to our supported base languages
  const filteredCodes = localeCodes.filter((code) => {
    const baseLanguage = code.split("-")[0].toLowerCase();
    return SUPPORTED_LANGUAGE_CODES.includes(baseLanguage);
  });

  // Map codes to display names
  const items: LocaleItem[] = filteredCodes.map((code) => {
    try {
      // .of() returns the localized name (e.g., "English (United States)" if displayLocale is 'en')
      const name = display.of(code) || code;
      return { code, name };
    } catch {
      return { code, name: code };
    }
  });

  // Sort alphabetically by localized name for a better UX
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
