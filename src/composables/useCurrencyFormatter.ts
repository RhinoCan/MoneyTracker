// @/composables/useCurrencyFormatter.ts
import { useSettingsStore } from "@/stores/SettingsStore";
import { logException } from "@/lib/Logger";

export function useCurrencyFormatter() {
  const settingsStore = useSettingsStore();

  /**
   * formatCurrency
   * Formats a numeric amount as a localized currency string.
   * This is a plain function, not a computed ref — call as formatCurrency(amount).
   */
  function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "---";
    }

    const locale = settingsStore.locale || "en-US";
    const currency = settingsStore.currency || "USD";

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
      }).format(amount);
    } catch (err) {
      logException(err, {
        module: "useCurrencyFormatter",
        action: "formatCurrency",
        slug: "currFormat.failed",
        data: { amount, locale, currency },
      });
      return amount.toString();
    }
  }

  return { formatCurrency };
}
