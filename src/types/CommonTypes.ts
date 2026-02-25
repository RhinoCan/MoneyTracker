// src/types/Common.ts - Defines common types used across the application for localization and formatting.

/**
 * Interface representing a single locale option for display in a selector.
 */
export interface LocaleOption {
  /** The BCP 47 language tag (e.g., 'en-US', 'es-ES'). */
  code: string;
  /** The human-readable label (e.g., 'English (United States)'). */
  label: string;
}

// ISO 4217 currency codes you support
export type SupportedCurrency =
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
