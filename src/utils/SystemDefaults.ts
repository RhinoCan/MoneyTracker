// src/utils/SystemDefaults.ts - Initialization logic relying on native browser Intl API.
// Exports default values for Pinia store initialization AND common application types.

export const appName = import.meta.env.VITE_APP_NAME || 'money-tracker';

// --- Type Definitions (Merged from former Common.ts) ---
export type CurrencyDisplay = 'symbol' | 'code' | 'name' | 'narrowSymbol';
export type CurrencySign = 'standard' | 'accounting';

export interface NumberFormat {
    minPrecision?: number;
    maxPrecision: number;
    thousandsSeparator: boolean;
    currency: string;
    currencyDisplay: CurrencyDisplay;
    currencySign: CurrencySign;

    // Legacy properties maintained for store structure, but not used by Intl.NumberFormat
    useBankersRounding: boolean;
    negativeZero: boolean;
}

/**
 * Interface representing a single locale option for display in a selector.
 */
export interface LocaleOption {
    /** The BCP 47 language tag (e.g., 'en-US', 'es-ES'). */
    code: string;
    /** The human-readable label (e.g., 'English (United States)'). */
    label: string;
}

// --- 1. Determine Default Locale ---
// Use the browser's preferred language tag (e.g., "en-US", "de-DE").
export const defaultLocale = navigator.language || 'en-US';

// --- 2. Determine Default Country ---
// Extract the region part (e.g., "en-US" -> "US")
const parts = defaultLocale.split('-');
export const defaultCountry = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'US';

// --- 3. Determine Default Currency Code ---
let currencyCode = 'USD'; // Fallback value
export let defaultCurrencyUndefined = false; // <-- RE-ADDED for testing

try {
    // Create a dummy NumberFormat object for the detected locale and read the resolved currency.
    const formatter = new Intl.NumberFormat(defaultLocale, {
        style: 'currency',
        currency: 'USD', // Placeholder value
    });

    // The browser resolves the currency to the locale's standard currency
    // Use nullish coalescing (??) for type safety.
    currencyCode = formatter.resolvedOptions().currency ?? currencyCode;
} catch (e) {
    console.warn("[SystemDefaults] Failed to determine default currency. Falling back to USD.", e);
    defaultCurrencyUndefined = true; // <-- Set flag on error
}

export const defaultToastTimeout = 3000; //3000 milliseconds = 3 seconds

export const defaultCurrencyCode = currencyCode;

// --- Default Formatting Options (Matching CurrencyStore) ---
// These are standard, non-Intl-specific defaults that set the initial Pinia state.
export const defaultMinPrecision = 2;
export const defaultMaxPrecision = 2;
export const defaultThousandsSeparator = true; // Maps to Intl.useGrouping
export const defaultUseBankersRounding = false; // Legacy property
export const defaultNegativeZero = true; // Legacy property
export const defaultCurrencyDisplay = "symbol";
export const defaultCurrencySign = "standard";