// src/types/Common.ts - Defines common types used across the application for localization and formatting.

export type CurrencyDisplay = 'symbol' | 'code' | 'name' | 'narrowSymbol';
export type CurrencySign = 'standard' | 'accounting';

export interface NumberFormat {
    minPrecision?: number;
    maxPrecision: number;
    thousandsSeparator: boolean;
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
  ISO = 'yyyy-MM-dd',
  USA = 'MM/dd/yyyy',
  EUR = 'dd.MM.yyyy'
}