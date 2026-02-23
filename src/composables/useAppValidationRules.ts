// @/composables/useAppValidationRules.ts
import { i18n } from "@/i18n";
import { logWarning } from "@/lib/Logger";
import { useSettingsStore } from "@/stores/SettingsStore";
import { parseCurrency } from "@/utils/currencyParser";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";

export function useAppValidationRules() {
  const t = (i18n.global as any).t;
  const settingsStore = useSettingsStore();
  const { hasCorrectSeparator, decimalSeparator } = useNumberFormatHints();

  const required = (v: any) => !!v || t("useApp.reqd");

  const transactionTypeRequired = (v: any) =>
    ["Income", "Expense"].includes(v) || t("useApp.transReqd");

  const amountRules = (v: any) => {
    if (!v && v !== 0) return t("useApp.reqdZeroOk");
    if (!hasCorrectSeparator(String(v)))
      return t("useApp.wrongSeparator", { separator: decimalSeparator.value });
    const num = parseCurrency(String(v), settingsStore.locale);
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
      logWarning("Date validation failed: Invalid date object", {
        module: "useAppValidationRules",
        action: "dateRules",
        data: { input: value },
      });
      return t("useApp.invalidFmt");
    }

    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      logWarning("Date validation failed: Date components mismatch", {
        module: "useAppValidationRules",
        action: "dateRules",
        data: { input: value, parsed: parsedDate },
      });
      return t("useApp.invalidFmt");
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    now.setHours(23, 59, 59, 999);
    if (parsedDate > now) {
      return t("useApp.notFuture");
    }

    if (parsedDate.getFullYear() !== currentYear) {
      return t("useApp.notPrevYear", { year: parsedDate.getFullYear() });
    }

    return true;
  };

  const otherTabRules = (v: any) => {
    if (v === null || v === undefined || v === "") return t("useApp.reqd");

    const num = Number(v);

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
    otherTabRules,
  };
}
