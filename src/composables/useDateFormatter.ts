// @/composables/useDateFormatter.ts
import { useI18n } from "vue-i18n";

export function useDateFormatter() {
  const { locale } = useI18n();

  /**
   * Formats a date for UI display using the user's locale
   * @param value - Date as YYYY-MM-DD string, Date object, or null
   * @returns Localized date string using medium style
   */
  function formatForUI(value: string | Date | null): string {
    if (!value) return "";

    let date: Date;

    if (typeof value === "string") {
      // Strip time part if present and parse as local date
      const dateOnly = value.substring(0, 10);
      const [year, month, day] = dateOnly.split("-").map(Number);
      date = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      date = value;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: "medium",
    }).format(date);
  }

  /**
   * Converts a Date object to YYYY-MM-DD string (source of truth format)
   * @param date - Date object
   * @returns YYYY-MM-DD string
   */
  function toISODateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return {
    formatForUI,
    toISODateString,
  };
}
