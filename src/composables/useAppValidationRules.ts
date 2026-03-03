// @/composables/useAppValidationRules.ts
import { i18n } from "@/i18n";
import { useSettingsStore } from "@/stores/SettingsStore";
import { parseCurrency } from "@/utils/currencyParser";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";
import type { ComposerTranslation } from "vue-i18n";

export function useAppValidationRules() {
  // Accessing i18n.global directly for use outside component setup.
  const t = (i18n.global as unknown as { t: ComposerTranslation }).t;
  const settingsStore = useSettingsStore();
  const { hasCorrectSeparator, decimalSeparator } = useNumberFormatHints();

  const required = (v: unknown) => {
    if (v === 0) return true;
    return !!v || t("useApp.reqd");
  };

  const transactionTypeRequired = (v: string) =>
    ["Income", "Expense"].includes(v) || t("useApp.transReqd");

  const amountRules = (v: unknown) => {
    if (!v && v !== 0) return t("useApp.reqd");
    const valStr = String(v);

    if (!hasCorrectSeparator(valStr))
      return t("useApp.wrongSeparator", { separator: decimalSeparator.value });

    const num = parseCurrency(valStr, settingsStore.locale);
    if (num === null || num <= 0) return t("useApp.greater");
    return true;
  };

  const dateRules = (value: string) => {
    if (!value || value.trim() === "") {
      return t("useApp.dateReqd");
    }

    const [year, month, day] = value.split("-").map(Number);
    const parsedDate = new Date(year, month - 1, day);

    if (isNaN(parsedDate.getTime())) {
      return t("useApp.invalidFmt");
    }

    // Integrity check: ensures dates like Feb 31st don't roll over
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      return t("useApp.invalidFmt");
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    if (parsedDate > endOfToday) {
      return t("useApp.notFuture");
    }

    // Strict Requirement: Must be the current calendar year
    if (parsedDate.getFullYear() !== currentYear) {
      return t("useApp.notPrevYear", { year: currentYear });
    }

    return true;
  };

  /**
   * Validates the notification message timeout setting.
   * Formerly 'otherTabRules', renamed to be honest and meaningful.
   */
  const timeoutRules = (v: unknown) => {
    if (v === null || v === undefined || v === "") return t("useApp.reqd");

    const num = typeof v === "number" ? v : Number(v);

    if (isNaN(num) || num < -1) return t("useApp.timeoutMin");
    if (num > 10) return t("useApp.timeoutMax");
    if (!Number.isInteger(num)) return t("useApp.timeoutInteger");

    return true;
  };

  return {
    required,
    transactionTypeRequired,
    dateRules,
    amountRules,
    timeoutRules,
  };
}
