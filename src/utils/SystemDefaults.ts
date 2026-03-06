// @/utils/SystemDefaults.ts

/**
 * Interface representing a single locale option for display in selectors.
 */
export interface LocaleOption {
  code: string; // e.g., 'en-US'
  label: string; // e.g., 'English (United States)'
}

// --- 1. Detect Locale & Region ---
export const defaultLocale = navigator.language || "en-US";

const localeParts = defaultLocale.split("-");
export const defaultCountry =
  localeParts.length > 1 ? localeParts[localeParts.length - 1].toUpperCase() : "US";

// --- 2. Default Currency ---
// Default currency before any user preference is known.
// Locale-to-currency mapping happens in SettingsStore when the user selects a locale.
export const defaultCurrencyCode = "USD";

/**
 * getCurrencyDisplayNames
 * Returns the currency code along with its English and localized display names.
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'JPY')
 * @param locale - The locale to use for the localized name (e.g., 'ja-JP')
 */
export function getCurrencyDisplayNames(currency: string, locale: string) {
  const english = new Intl.DisplayNames("en", { type: "currency" });
  const local = new Intl.DisplayNames(locale, { type: "currency" });

  return {
    code: currency,
    english: english.of(currency) ?? currency,
    local: local.of(currency) ?? currency,
  };
}
