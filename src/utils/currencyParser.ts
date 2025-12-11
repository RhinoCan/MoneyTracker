// src/utils/currencyParser.ts

import { useLocaleStore } from "@/stores/LocaleStore.ts";

/**
 * Takes a raw or formatted string from a user input field and converts it back to a number.
 * It uses the current locale to correctly identify decimal and thousands separators.
 *
 * @param {string} formattedString - The string value from the input field (e.g., "1.234,56" or "1,234.56").
 * @returns {number | null} - The numeric amount (e.g., 1234.56), or null if parsing fails.
 */
export function parseCurrency(formattedString: string): number | null {
  if (typeof formattedString !== 'string' || !formattedString) return null;

  const localeStore = useLocaleStore();
  const locale = localeStore.currentLocale;

  try {
    // 1. Get the locale's separators by formatting a dummy number
    const parts = new Intl.NumberFormat(locale).formatToParts(1111.11);
    const decimalSeparatorPart = parts.find(part => part.type === 'decimal');
    const groupSeparatorPart = parts.find(part => part.type === 'group');
    const currencySeparatorPart = parts.find(part => part.type === 'currency'); // Added for currency symbol check

    const decimalSeparator = decimalSeparatorPart ? decimalSeparatorPart.value : '.';
    const groupSeparator = groupSeparatorPart ? groupSeparatorPart.value : ',';
    const currencySymbol = currencySeparatorPart ? currencySeparatorPart.value : '$';

    let rawString = formattedString.trim();

    // --- START OF NEW/REVISED LOGIC ---

    // A. Remove all grouping (thousands) separators
    if (groupSeparator) {
      const escapedGroupSeparator = groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const groupSeparatorRegex = new RegExp(escapedGroupSeparator, 'g');
      rawString = rawString.replace(groupSeparatorRegex, '');
    }

    // B. Remove the expected currency symbol (if present)
    if (currencySymbol) {
        // Use a global regex to remove all occurrences of the known symbol
        const escapedCurrencySymbol = currencySymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const currencySymbolRegex = new RegExp(escapedCurrencySymbol, 'g');
        rawString = rawString.replace(currencySymbolRegex, '');
    }

    // C. Convert the locale-specific decimal separator to the standard JS '.'
    if (decimalSeparator !== '.') {
      rawString = rawString.replace(decimalSeparator, '.');
    }

    // D. CRITICAL VALIDATION: Check for illegal characters (like 'a', 'b', etc.)
    // If the string contains anything that is NOT a digit or a dot, reject it.
    // This is the direct fix for the "12.00a" issue.
    if (/[^\d.]/.test(rawString)) {
        return null; // Input contains illegal characters (e.g., letters, multiple symbols)
    }

    // E. CRITICAL VALIDATION: Check for multiple decimal points (e.g., "1.2.3")
    if ((rawString.match(/\./g) || []).length > 1) {
        return null; // Input contains too many decimal points
    }

    // --- END OF NEW/REVISED LOGIC ---

    // Final Parse
    const parsedValue = parseFloat(rawString);

    // Return the number, or null if it resulted in NaN or zero (must be > 0 for validation)
    return isNaN(parsedValue) || parsedValue <= 0 ? null : parsedValue;

  } catch (e) {
    // This catch block handles internal formatting errors, unlikely for simple inputs.
    console.error("Failed to parse currency string:", e);
    return null;
  }
}