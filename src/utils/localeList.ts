// @/utils/localeList.ts
import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  "it",
];

export interface LocaleItem {
  code: string;
  name: string;
}

/**
 * Generates a list of locale objects containing the code and the localized name.
 * @param displayLocale - The language to use for the names in the list (defaults to 'en').
 * @returns Sorted array of LocaleItem objects.
 */
export function generateLocaleList(displayLocale: string = "en"): LocaleItem[] {
  let display: Intl.DisplayNames;

  try {
    display = new Intl.DisplayNames([displayLocale], { type: "language" });
  } catch {
    // Fallback for extremely restrictive environments
    return [{ code: "en-US", name: "English (US)" }];
  }

  let localeCodes: string[];

  try {
    // Modern way to get browser-supported locales
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
      // Use cast instead of @ts-ignore for better type safety
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      localeCodes = (Intl as any).supportedValuesOf("language"); // Intl.supportedValuesOf is not yet in TypeScript's type definitions
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
      "it-IT",
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