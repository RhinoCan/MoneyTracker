import { computed, type ComputedRef } from "vue";
import { useLocaleStore } from "@/stores/LocaleStore.ts";
import { useCurrencyStore } from "@/stores/CurrencyStore.ts";

type DisplayMoneyFunction = (amount: number | null | undefined) => string;

const LOCALE_TO_CURRENCY_MAP: Record<string, string> = {
  "en-US": "USD",
  "en-CA": "CAD",
  "fr-CA": "CAD",
  "es-MX": "MXN",
  "fr-FR": "EUR",
  "de-DE": "EUR",
  "es-ES": "EUR",
  "it-IT": "EUR",
  "nl-NL": "EUR",
  "en-GB": "GBP",
  "ru-RU": "RUB",
  "ja-JP": "JPY",
  "zh-CN": "CNY",
  "ko-KR": "KRW",
  "en-IN": "INR",
  "hi-IN": "INR",
  "id-ID": "IDR",
  "en-AU": "AUD",
  "zh-TW": "TWD",
  "th-TH": "THB",
  "ar-SA": "SAR",
  "ar-EG": "EGP",
  "pt-BR": "BRL",
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
      const formatter = new Intl.NumberFormat(locale, options);

      return (amount: number | null | undefined) => {
        if (amount == null) return "";
        return formatter.format(amount);
      };
    } catch (e) {
      console.error(`[Currency Formatter] Failed to create formatter for locale ${locale}:`, e);
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
