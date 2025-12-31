// __tests__/utils/currencyParser.spec.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCurrency } from '@/utils/currencyParser';

// We use this to control what locale the parser thinks it is using
let mockLocale = 'en-US';

describe('parseCurrency (Utility)', () => {

    beforeEach(() => {
        mockLocale = 'en-US';
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    // --- TEST GROUP 1: BASE VALIDATION & EDGE CASES ---
    describe('Base Validation & Edge Cases', () => {

        test('should return null for non-string, null, or empty input', () => {
            // @ts-ignore - Testing illegal input types with mandatory second param
            expect(parseCurrency(null, mockLocale)).toBeNull();
            // @ts-ignore
            expect(parseCurrency(undefined, mockLocale)).toBeNull();
            // @ts-ignore
            expect(parseCurrency(123, mockLocale)).toBeNull();
            expect(parseCurrency('', mockLocale)).toBeNull();
            expect(parseCurrency(' ', mockLocale)).toBeNull();
        });

        test('should return null if the parsed value is zero or less', () => {
            expect(parseCurrency('0', mockLocale)).toBeNull();
            expect(parseCurrency('0.00', mockLocale)).toBeNull();
            expect(parseCurrency('-10', mockLocale)).toBeNull();
        });

        test('should handle simple integer input correctly', () => {
            expect(parseCurrency('1234', mockLocale)).toBe(1234);
            expect(parseCurrency('1', mockLocale)).toBe(1);
        });
    });

    // --- TEST GROUP 2: US/STANDARD LOCALE (en-US) ---
    describe('US Locale (en-US)', () => {
        test('should parse a simple US formatted string (with cents)', () => {
            expect(parseCurrency('12.34', 'en-US')).toBe(12.34);
        });

        test('should handle thousands separators', () => {
            expect(parseCurrency('1,234.56', 'en-US')).toBe(1234.56);
            expect(parseCurrency('100,000', 'en-US')).toBe(100000);
        });

        test('should correctly remove the currency symbol', () => {
            // en-US NumberFormat typically identifies '$'
            expect(parseCurrency('$1,234.56', 'en-US')).toBe(1234.56);
        });
    });

    // --- TEST GROUP 3: EUROPEAN/FRENCH LOCALE (fr-FR) ---
    describe('French Locale (fr-FR)', () => {
        beforeEach(() => {
            mockLocale = 'fr-FR';
            // Explicitly mock the separators for French
            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: vi.fn((): Intl.NumberFormatPart[] => [
                    { type: 'group', value: ' ' },
                    { type: 'decimal', value: ',' },
                    { type: 'currency', value: '€' },
                ]),
            } as any));
        });

        test('should parse a French formatted string correctly', () => {
            expect(parseCurrency('12,34', mockLocale)).toBe(12.34);
        });

        test('should handle thousands (space) separators', () => {
            expect(parseCurrency('1 234,56', mockLocale)).toBe(1234.56);
        });

        test('should correctly remove the € symbol', () => {
            expect(parseCurrency('1 234,56€', mockLocale)).toBe(1234.56);
        });
    });

    // --- TEST GROUP 4: CRITICAL VALIDATION ---
    describe('Critical Validation', () => {
        test('should return null for strings with illegal characters', () => {
            expect(parseCurrency('123a', 'en-US')).toBeNull();
            expect(parseCurrency('123.45x', 'en-US')).toBeNull();
            expect(parseCurrency('123-', 'en-US')).toBeNull();
        });

        test('should return null for input with multiple decimal points', () => {
            expect(parseCurrency('1.2.3', 'en-US')).toBeNull();
        });
    });

    // --- TEST GROUP 5: CATCH BLOCK & FALLBACKS ---
    describe('Error Handling & Fallbacks', () => {
        test('should return null if Intl.NumberFormat throws an exception', () => {
            vi.spyOn(Intl, 'NumberFormat').mockImplementationOnce(() => {
                throw new Error("Forced Intl Error");
            });

            const result = parseCurrency('123.45', 'en-US');
            expect(result).toBeNull();
        });

        test('should use fallback "." and "," when parts are missing', () => {
            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: vi.fn().mockReturnValue([
                    { type: 'integer', value: '1111' } // Missing decimal and group
                ]),
            } as any));

            // Should successfully use fallbacks to parse
            expect(parseCurrency('1,234.56', 'en-US')).toBe(1234.56);
        });
    });
});