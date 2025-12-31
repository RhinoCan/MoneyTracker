import { computed, type ComputedRef } from "vue";
import { useLocaleStore } from "@/stores/LocaleStore.ts";
import { useCurrencyStore } from "@/stores/CurrencyStore.ts";
import { logException } from "@/utils/Logger"

type DisplayMoneyFunction = (amount: number | null | undefined) => string;

const LOCALE_TO_CURRENCY_MAP: Record<string, string> = {
  // North America
  "en-US": "USD", "en": "USD",
  "en-CA": "CAD", "fr-CA": "CAD",
  "es-MX": "MXN",

  // Europe (Eurozone)
  "fr-FR": "EUR", "fr": "EUR",
  "de-DE": "EUR", "de": "EUR",
  "es-ES": "EUR", "es": "EUR",
  "it-IT": "EUR", "it": "EUR",
  "nl-NL": "EUR", "nl": "EUR",

  // Europe (Non-Euro)
  "en-GB": "GBP",
  "ru-RU": "RUB", "ru": "RUB",

  // Asia
  "ja-JP": "JPY", "ja": "JPY",
  "zh-CN": "CNY", "zh": "CNY",
  "ko-KR": "KRW", "ko": "KRW",
  "en-IN": "INR", "hi-IN": "INR", "hi": "INR",
  "id-ID": "IDR", "id": "IDR",
  "zh-TW": "TWD",
  "th-TH": "THB", "th": "THB",

  // Middle East & Africa
  "ar-SA": "SAR", "ar-EG": "EGP", "ar": "SAR", // Default Arabic to SAR

  // Oceania
  "en-AU": "AUD",

  // South America
  "pt-BR": "BRL", "pt": "BRL",
  "es-AR": "ARS",
};

export function useCurrencyFormatter() {
  const localeStore = useLocaleStore();
  const currencyStore = useCurrencyStore();

  const reactiveFormatter: ComputedRef<DisplayMoneyFunction> = computed(() => {
    const locale = localeStore.currentLocale;
    const formatOptions = currencyStore.numberFormat;

    // Determine effective currency
    const storeCurrency = formatOptions.currency;
    let effectiveCurrency = storeCurrency;

    const [lang, region] = locale.split("-");
    const canonicalLocale = region ? `${lang.toLowerCase()}-${region.toUpperCase()}` : lang.toLowerCase();

    if (storeCurrency === "USD") {
      let inferredCurrency = LOCALE_TO_CURRENCY_MAP[canonicalLocale];
      if (!inferredCurrency) inferredCurrency = LOCALE_TO_CURRENCY_MAP[lang];
      effectiveCurrency = inferredCurrency || storeCurrency;
    }

    const options: Intl.NumberFormatOptions = {
      style: "currency",
      currency: effectiveCurrency,
      currencyDisplay: formatOptions.currencyDisplay,
      currencySign: formatOptions.currencySign,
      minimumFractionDigits: formatOptions.minPrecision,
      maximumFractionDigits: formatOptions.maxPrecision,
      useGrouping: formatOptions.thousandsSeparator,
    };

    try {
      const formatter = new Intl.NumberFormat(canonicalLocale, options);

      return (amount: number | null | undefined) => {
        if (amount == null) return "";
        return formatter.format(amount);
      };
    } catch (e) {
      logException(e, { module: "useCurrencyFormatter", action: "create formatter for locale", data: {locale, effectiveCurrency, options}});
      return (amount: number | null | undefined) => {
        if (amount == null) return "";
        return `${effectiveCurrency} ${amount.toFixed(formatOptions.maxPrecision)}`;
      };
    }
  });

  // --- Shorthand function for easy use in components/templates ---
  const displayMoney = (amount: number | null | undefined) => reactiveFormatter.value(amount);

  return { displayMoney };
}
