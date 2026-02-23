import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

const t = (i18n.global as any).t;

/**
 * Parses a localized currency string into a numeric value.
 */
export function parseCurrency(formattedString: string, locale: string): number | null {
  if (!formattedString || typeof formattedString !== "string") {
    return null;
  }

  try {
    // 1. Identify locale-specific separators
    const parts = new Intl.NumberFormat(locale).formatToParts(1111.11);
    const decimalSeparator = parts.find((p) => p.type === "decimal")?.value ?? ".";
    const groupSeparator = parts.find((p) => p.type === "group")?.value ?? ",";

    let rawString = formattedString.trim();

    // 2. Escape separators for Regex safety
    const escapedDecimal = decimalSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedGroup = groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // 3. Remove group separators (thousands)
    rawString = rawString.replace(new RegExp(escapedGroup, "g"), "");

    // 4. Clean up non-numeric characters except the decimal and minus sign
    const keepRegex = new RegExp(`[^\\d${escapedDecimal}-]`, "g");
    rawString = rawString.replace(keepRegex, "");

    // 5. Normalize decimal separator to standard "." for parseFloat
    if (decimalSeparator !== ".") {
      rawString = rawString.replace(decimalSeparator, ".");
    }

    // 6. Final Validation & Parsing
    if ((rawString.match(/\./g) || []).length > 1) {
      return null;
    }

    const parsedValue = parseFloat(rawString);

    return isNaN(parsedValue) || parsedValue <= 0 ? null : parsedValue;
  } catch (error) {
    logException(error, {
      module: "currencyParser",
      action: "parseCurrency",
      slug: t("currParser.parser_failure"),
      data: { formattedString, locale },
    });
    return null;
  }
}
