import { computed } from "vue";
import { useSettingsStore } from "@/stores/SettingsStore";
import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

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
          slug: t('currFormat.failed'),
          data: { amount, locale, currency },
        });
        return amount.toString();
      }
    };
  });
  return { displayMoney };
}
