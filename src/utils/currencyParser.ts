import { logException } from "@/lib/Logger";

/**
 * parseCurrency
 * Converts a localized currency string back into a numeric 'Source of Truth'.
 * Logic Flow:
 * 1. Probes the locale to find the decimal character.
 * 2. Strips currency symbols, whitespace, and thousands separators.
 * 3. Normalizes the decimal to a standard "." for parseFloat.
 */
export function parseCurrency(formattedString: string, locale: string): number | null {
  if (!formattedString || typeof formattedString !== "string") {
    return null;
  }

  try {
    // 1. Probe locale-specific decimal separator
    const parts = new Intl.NumberFormat(locale).formatToParts(1111.11);
    const decimalSeparator = parts.find((p) => p.type === "decimal")?.value ?? ".";

    let rawString = formattedString.trim();

    // 2. Escape decimal separator for Regex safety
    const escapedDecimal = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 3. Strip everything except digits, the decimal separator, and the minus sign.
    // This removes currency symbols ($, €, £), whitespace, and thousands separators.
    const cleanupRegex = new RegExp(`[^\\d${escapedDecimal}-]`, "g");
    rawString = rawString.replace(cleanupRegex, "");

    // 4. Normalize to standard JS decimal point
    if (decimalSeparator !== ".") {
      rawString = rawString.replace(new RegExp(escapedDecimal, "g"), ".");
    }

    // 5. Integrity Check: Ensure we haven't ended up with multiple decimals
    const decimalMatches = rawString.match(/\./g);
    if (decimalMatches && decimalMatches.length > 1) {
      return null;
    }

    const parsedValue = parseFloat(rawString);

    // 6. Validation: Return null if parsing failed or results in an invalid number
    if (isNaN(parsedValue)) {
      return null;
    }

    // In this app context, transactions must be positive numbers.
    return parsedValue > 0 ? parsedValue : null;

  } catch (error) {
    logException(error, {
      module: "currencyParser",
      action: "parseCurrency",
      slug: "currParser.parser_failure",
      data: { formattedString, locale },
    });
    return null;
  }
}
