import { computed } from "vue";
import { useSettingsStore } from "@/stores/SettingsStore";
import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (i18n.global as any).t;

export function useCurrencyFormatter() {
  const settingsStore = useSettingsStore();
  const displayMoney = computed(() => {
    const locale = settingsStore.locale || "en-US";
    const currency = settingsStore.currency || "USD";
    return (amount: number | null | undefined): string => {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return "---";
      }
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currency,
        }).format(amount);
      } catch (err) {
        logException(err, {
          module: "useCurrencyFormatter",
          action: "formatNumber",
          slug: t("currFormat.failed"),
          data: { amount, locale, currency },
        });
        return amount.toString();
      }
    };
  });
  return { displayMoney };
}
