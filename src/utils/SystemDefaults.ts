// @/utils/SystemDefaults.ts
import { i18n } from "@/i18n";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (i18n.global as any).t;

/**
 * Global App Constants
 */
export const appName = import.meta.env.VITE_APP_NAME || "money-tracker";
export const defaultSystemTimeout = 0; // 0ms = persistent until dismissed

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

// --- 2. Determine Default Currency Code ---
let detectedCurrency = "USD";

try {
  // We use a dummy format to see if the browser can resolve a currency for the locale
  const formatter = new Intl.NumberFormat(defaultLocale, {
    style: "currency",
    currency: "USD", // Required by the constructor
  });

  // resolvedOptions().currency usually reflects the input, but we check for environment safety
  detectedCurrency = formatter.resolvedOptions().currency ?? "USD";
} catch (e) {
  // DYNAMIC IMPORT: Prevents circular dependency during initialization
  import("@/lib/Logger").then((m) =>
    m.logException(e, {
      module: "SystemDefaults",
      action: "detectCurrency",
      slug: t("defaults.currency_detection_failed"),
      data: { locale: defaultLocale },
    })
  );
}

export const defaultCurrencyCode = detectedCurrency;

export function getCurrencyDisplayNames(currency: string, locale: string) {
  const english = new Intl.DisplayNames("en", { type: "currency" });
  const local = new Intl.DisplayNames(locale, { type: "currency" });

  return {
    code: currency,
    english: english.of(currency) ?? currency,
    local: local.of(currency) ?? currency,
  };
}
