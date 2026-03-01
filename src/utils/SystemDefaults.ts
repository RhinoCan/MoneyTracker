// @/utils/SystemDefaults.ts

/**
 * Global App Constants
 */
export const appName = import.meta.env.VITE_APP_NAME || "money-tracker";
export const defaultSystemTimeout = 0; // 0 = persistent until dismissed

// --- Type Definitions ---
export type CurrencyDisplay = "symbol" | "code" | "name" | "narrowSymbol";
export type CurrencySign = "standard" | "accounting";

export interface NumberFormat {
  minPrecision?: number;
  maxPrecision: number;
  useGrouping: boolean;
  currency: string;
  currencyDisplay: CurrencyDisplay;
  currencySign: CurrencySign;
  // Legacy properties maintained for store compatibility
  useBankersRounding: boolean;
  negativeZero: boolean;
}

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
