import { logException } from "@/lib/Logger";

/**
 * parseCurrency
 * Converts a localized currency string back into a numeric 'Source of Truth'.
 * Logic Flow:
 * 1. Probes the locale to find the decimal character.
 * 2. Normalizes Arabic-Indic and Extended Arabic-Indic digits to ASCII (0-9).
 * 3. Strips currency symbols, whitespace, and thousands separators.
 * 4. Normalizes the decimal to a standard "." for parseFloat.
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

    // 2. Normalize non-ASCII digit scripts to ASCII.
    //    Arabic-Indic digits (U+0660–U+0669) and Extended Arabic-Indic digits
    //    (U+06F0–U+06F9, used in Persian/Urdu) are not matched by the \d
    //    character class in JavaScript, so they must be converted before any
    //    regex-based cleanup. Western digits (0-9) are unaffected.
    rawString = rawString
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));

    // 3. Escape decimal separator for Regex safety
    const escapedDecimal = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 4. Strip everything except digits, the decimal separator, and the minus sign.
    // This removes currency symbols ($, €, £, ر.س), whitespace, and thousands separators.
    const cleanupRegex = new RegExp(`[^\\d${escapedDecimal}-]`, "g");
    rawString = rawString.replace(cleanupRegex, "");

    // 5. Normalize to standard JS decimal point
    if (decimalSeparator !== ".") {
      rawString = rawString.replace(new RegExp(escapedDecimal, "g"), ".");
    }

    // 6. Integrity Check: Ensure we haven't ended up with multiple decimals
    const decimalMatches = rawString.match(/\./g);
    if (decimalMatches && decimalMatches.length > 1) {
      return null;
    }

    const parsedValue = parseFloat(rawString);

    // 7. Validation: Return null if parsing failed or results in an invalid number
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
