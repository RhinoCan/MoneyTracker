// src/types/Common.ts - Defines common types used across the application for localization and formatting.

export type CurrencyDisplay = "symbol" | "code" | "name" | "narrowSymbol";
export type CurrencySign = "standard" | "accounting";

export interface NumberFormat {
  minPrecision?: number;
  maxPrecision: number;
  useGrouping: boolean;
  currency: string;
  currencyDisplay: CurrencyDisplay;
  currencySign: CurrencySign;

  // Legacy properties maintained for store structure, but not used by Intl.NumberFormat
  useBankersRounding: boolean;
  negativeZero: boolean;
}

/**
 * Interface representing a single locale option for display in a selector.
 */
export interface LocaleOption {
  /** The BCP 47 language tag (e.g., 'en-US', 'es-ES'). */
  code: string;
  /** The human-readable label (e.g., 'English (United States)'). */
  label: string;
}

export enum DateFormatTemplate {
  ISO = "ISO",
  USA = "USA",
  EUR = "EUR",
}

export const DateFormatTokens = {
  [DateFormatTemplate.ISO]: "yyyy-MM-dd",
  [DateFormatTemplate.USA]: "MM/dd/yyyy",
  [DateFormatTemplate.EUR]: "dd.MM.yyyy",
};

// ISO 4217 currency codes you support
export type CurrencyCode =
  | "USD"
  | "CAD"
  | "GBP"
  | "EUR"
  | "CHF"
  | "CNY"
  | "JPY"
  | "KRW"
  | "INR"
  | "SAR"
  | "RUB"
  | "BRL";

// Supported BCP 47 locales
export type SupportedLocale =
  | "en-US"
  | "en-CA"
  | "en-GB"
  | "fr-FR"
  | "fr-CA"
  | "fr-CH"
  | "es-ES"
  | "de-DE"
  | "zh-CN"
  | "ja-JP"
  | "ko-KR"
  | "hi-IN"
  | "ar-SA"
  | "ru-RU"
  | "pt-BR"
  | "it-IT";
