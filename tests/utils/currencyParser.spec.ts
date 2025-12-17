// __tests__/utils/currencyParser.spec.ts

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseCurrency } from '@/utils/currencyParser';
import { useLocaleStore } from '@/stores/LocaleStore.ts';

// --- MOCK THE DEPENDENCY (LocaleStore) ---
// We need to control the 'currentLocale' to test different formatting rules.
let mockLocale = 'en-US';

vi.mock('@/stores/LocaleStore.ts', () => {
    return {
        useLocaleStore: vi.fn(() => ({
            get currentLocale() {
                return mockLocale;
            }
        })),
    };
});
// ------------------------------------------

describe('parseCurrency (Utility)', () => {

    beforeEach(() => {
        // Reset the mock locale before each test
        mockLocale = 'en-US';
        vi.clearAllMocks();
    });

    // --- TEST GROUP 1: BASE VALIDATION & EDGE CASES ---
    describe('Base Validation & Edge Cases', () => {

        test('should return null for non-string, null, or empty input', () => {
            // @ts-ignore - Testing illegal input types
            expect(parseCurrency(null)).toBeNull();
            // @ts-ignore - Testing illegal input types
            expect(parseCurrency(undefined)).toBeNull();
            // @ts-ignore - Testing illegal input types
            expect(parseCurrency(123)).toBeNull();
            expect(parseCurrency('')).toBeNull();
            expect(parseCurrency(' ')).toBeNull();
        });

        test('should return null if the parsed value is zero or less', () => {
            // Note: Your utility explicitly excludes 0 and negative numbers
            expect(parseCurrency('0')).toBeNull();
            expect(parseCurrency('0.00')).toBeNull();
            expect(parseCurrency('-10')).toBeNull();
        });

        test('should handle simple integer input correctly', () => {
            expect(parseCurrency('1234')).toBe(1234);
            expect(parseCurrency('1')).toBe(1);
        });
    });

    // --- TEST GROUP 2: US/STANDARD LOCALE (en-US) ---
    describe('US Locale (en-US): decimal=., group=, currency=$', () => {
        // Default mockLocale = 'en-US' (decimal '.', group ',', currency '$')

        test('should parse a simple US formatted string (with cents)', () => {
            expect(parseCurrency('12.34')).toBe(12.34);
        });

        test('should handle thousands separators', () => {
            expect(parseCurrency('1,234.56')).toBe(1234.56);
            expect(parseCurrency('100,000')).toBe(100000);
        });

        test('should correctly remove the currency symbol', () => {
            expect(parseCurrency('$1,234.56')).toBe(1234.56);
            expect(parseCurrency(' $12.50 ')).toBe(12.50); // with whitespace
        });
    });

    // --- TEST GROUP 3: EUROPEAN/FRENCH LOCALE (fr-FR) ---
    describe('French Locale (fr-FR): decimal=, group= (space), currency=€', () => {
        beforeEach(() => {
            // Setup for French locale: decimal is comma, group is a space, currency is €
            mockLocale = 'fr-FR';
            // Mock Intl.NumberFormat to explicitly return expected French parts
            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: vi.fn((): Intl.NumberFormatPart[] => [
                    { type: 'integer', value: '1' },
                    { type: 'group', value: ' ' }, // Space as group separator
                    { type: 'integer', value: '111' },
                    { type: 'decimal', value: ',' }, // Comma as decimal separator
                    { type: 'fraction', value: '11' },
                    { type: 'currency', value: '€' },
                ]),
                // @ts-ignore - Mocking a subset of Intl.NumberFormat
            } as unknown as Intl.NumberFormat));
        });

        test('should parse a French formatted string correctly (decimal comma)', () => {
            expect(parseCurrency('12,34')).toBe(12.34);
        });

        test('should handle thousands (space) separators', () => {
            expect(parseCurrency('1 234,56')).toBe(1234.56);
            expect(parseCurrency('100 000')).toBe(100000);
        });

        test('should correctly remove the currency symbol', () => {
            expect(parseCurrency('1 234,56€')).toBe(1234.56);
            expect(parseCurrency('€12,50')).toBe(12.50);
        });

        // Restore the original Intl.NumberFormat after the group runs
        afterEach(() => {
            vi.restoreAllMocks();
        });
    });

    // --- TEST GROUP 4: CRITICAL VALIDATION CHECKS ---
    describe('Critical Validation', () => {

        test('should return null for strings with illegal non-numeric characters (D)', () => {
            expect(parseCurrency('123a')).toBeNull(); // letter
            expect(parseCurrency('123.45x')).toBeNull(); // letter with cents
            expect(parseCurrency('123-')).toBeNull(); // symbol (hyphen)
            expect(parseCurrency('123.45 ')).toBe(123.45); // spaces are fine (trimmed)
        });

        test('should return null for input with multiple decimal points (E)', () => {
            expect(parseCurrency('1.2.3')).toBeNull();
            expect(parseCurrency('100.00.00')).toBeNull();
        });

        test('should correctly parse the number after validation', () => {
            // Ensure a valid number passes through all checks
            expect(parseCurrency('1234.56')).toBe(1234.56);
        });

        // --- NEW TEST FOR CATCH BLOCK COVERAGE ---
        test('should return null and handle the error if Intl.NumberFormat throws an exception (catch branch)', () => {
            // ARRANGE: Spy on console.error to ensure we catch the output
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // ARRANGE: Mock Intl.NumberFormat to throw an error on creation
            vi.spyOn(Intl, 'NumberFormat').mockImplementationOnce(() => {
                throw new Error("Forced Intl Error");
            });

            // ACT: Call the parser (which immediately hits the mocked error)
            const result = parseCurrency('123.45');

            // ASSERT 1: The function returned null (the catch block's return value)
            expect(result).toBeNull();

            // ASSERT 2: The console.error line in the catch block was executed
            expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to parse currency string:", expect.any(Error));

            // CLEANUP: Restore the original console.error and Intl.NumberFormat
            consoleErrorSpy.mockRestore();
            vi.restoreAllMocks();
        });
        // --- END OF NEW TEST ---
    });

    // --- TEST GROUP 5: SEPARATOR FALLBACK EDGE CASES (NEW FOR 100% COVERAGE) ---
    describe('Separator Fallback Edge Cases', () => {

        afterEach(() => {
            vi.restoreAllMocks();
        });

        // COVERS LINES 25-26: The fallback values for decimal and group separators
        test('should use fallback separators when formatToParts returns no decimal separator', () => {
            mockLocale = 'en-US';

            // Mock formatToParts to return parts without a decimal separator
            const mockFormatToParts = vi.fn().mockReturnValue([
                { type: 'integer', value: '1111' },
                // No decimal part
                // No group part
            ]);

            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: mockFormatToParts,
                format: vi.fn(),
                resolvedOptions: vi.fn(),
            } as any));

            // Should use fallback '.' for decimal and ',' for group separator
            const result = parseCurrency('1234.56');

            // Should successfully parse using the fallback separators
            expect(result).toBe(1234.56);
        });

        test('should use fallback separators when formatToParts returns no group separator', () => {
            mockLocale = 'en-US';

            // Mock formatToParts to return parts without a group separator
            const mockFormatToParts = vi.fn().mockReturnValue([
                { type: 'integer', value: '1111' },
                { type: 'decimal', value: '.' },
                { type: 'fraction', value: '11' },
                // No group part
            ]);

            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: mockFormatToParts,
                format: vi.fn(),
                resolvedOptions: vi.fn(),
            } as any));

            // Should use fallback ',' for group separator
            const result = parseCurrency('1,234.56');

            // Should successfully parse, removing the group separator
            expect(result).toBe(1234.56);
        });

        test('should use both fallback separators when formatToParts returns neither', () => {
            mockLocale = 'en-US';

            // Mock formatToParts to return parts without decimal or group separators
            const mockFormatToParts = vi.fn().mockReturnValue([
                { type: 'integer', value: '1111' },
                // No decimal or group parts
            ]);

            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: mockFormatToParts,
                format: vi.fn(),
                resolvedOptions: vi.fn(),
            } as any));

            // Should use fallback '.' for decimal and ',' for group
            const result = parseCurrency('1,234.56');

            expect(result).toBe(1234.56);
        });

        test('should handle undefined decimalSeparatorPart', () => {
            mockLocale = 'test-LOCALE';

            // Mock to return undefined for decimal part
            const mockFormatToParts = vi.fn().mockReturnValue([
                { type: 'integer', value: '100' },
                { type: 'group', value: ',' },
            ]);

            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: mockFormatToParts,
                format: vi.fn(),
                resolvedOptions: vi.fn(),
            } as any));

            // The decimalSeparatorPart.find() will return undefined
            // So decimalSeparator should default to '.'
            const result = parseCurrency('100.50');
            expect(result).toBe(100.50);
        });

        test('should handle undefined groupSeparatorPart', () => {
            mockLocale = 'test-LOCALE';

            // Mock to return undefined for group part
            const mockFormatToParts = vi.fn().mockReturnValue([
                { type: 'integer', value: '1234' },
                { type: 'decimal', value: '.' },
                { type: 'fraction', value: '56' },
            ]);

            vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
                formatToParts: mockFormatToParts,
                format: vi.fn(),
                resolvedOptions: vi.fn(),
            } as any));

            // The groupSeparatorPart.find() will return undefined
            // So groupSeparator should default to ','
            const result = parseCurrency('1,234.56');
            expect(result).toBe(1234.56);
        });
    });
});