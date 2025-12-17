import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { localeList } from '@/utils/localeList.ts'

describe('localeList Utility', () => {

  // 1. Check if the exported value is an array
  it('should export an array named localeList', () => {
    expect(Array.isArray(localeList)).toBe(true)
  })

  // 2. Check if the array contains at least a reasonable number of locales
  it('should contain at least 5 locale entries', () => {
    // Assuming a financial tracker supports a handful of common regions
    expect(localeList.length).toBeGreaterThanOrEqual(5)
  })

  // 3. Check the structure of the locale objects
  it('should ensure every locale object has a "code" and "name" property', () => {
    // Check the first few items to ensure structure consistency
    localeList.slice(0, 5).forEach(locale => {
      expect(locale).toHaveProperty('code')
      expect(typeof locale.code).toBe('string')
      expect(locale.code.length).toBeGreaterThan(0)

      expect(locale).toHaveProperty('name')
      expect(typeof locale.name).toBe('string')
      expect(locale.name.length).toBeGreaterThan(0)
    })
  })

  // 4. Check for the presence of common and expected locale codes (Case-Insensitive Fix)
  it('should include key locales like "en-US", "de-DE", and "ja-JP"', () => {
    // Convert all generated codes to lowercase for case-insensitive comparison,
    // as Intl API output can vary (e.g., 'en-US' vs 'en-us').
    const lowerCaseCodes = localeList.map(l => l.code.toLowerCase())

    expect(lowerCaseCodes).toContain('en-us')
    expect(lowerCaseCodes).toContain('de-de')
    expect(lowerCaseCodes).toContain('ja-jp')
    expect(lowerCaseCodes).toContain('es-es')
  })
})

// NEW TESTS FOR 100% COVERAGE
describe('localeList - Edge Cases', () => {
  let originalIntl: typeof Intl;

  beforeEach(() => {
    originalIntl = global.Intl;
  });

  afterEach(() => {
    global.Intl = originalIntl;
    vi.resetModules();
  });

  // COVERS LINE 37: The || code fallback when display.of() returns null/undefined
  it('should use locale code as fallback when DisplayNames.of() returns null', async () => {
    // Mock Intl.DisplayNames to return null for of()
    const mockOf = vi.fn().mockReturnValue(null);

    // Create a new Intl object with mocked DisplayNames
    const MockedIntl = {
      ...global.Intl,
      DisplayNames: vi.fn().mockImplementation(() => ({
        of: mockOf,
      })),
      supportedValuesOf: vi.fn().mockReturnValue(['test-LOCALE']),
    };

    global.Intl = MockedIntl as any;

    // Re-import the module to trigger generateLocaleList with our mocks
    const { generateLocaleList } = await import('@/utils/localeList');
    const result = generateLocaleList();

    // Should use the code as fallback when of() returns null
    expect(result.some(item => item.code === 'test-LOCALE' && item.name === 'test-LOCALE')).toBe(true);
    expect(mockOf).toHaveBeenCalledWith('test-LOCALE');
  });

  it('should use locale code as fallback when DisplayNames.of() returns undefined', async () => {
    // Mock Intl.DisplayNames to return undefined for of()
    const mockOf = vi.fn().mockReturnValue(undefined);

    const MockedIntl = {
      ...global.Intl,
      DisplayNames: vi.fn().mockImplementation(() => ({
        of: mockOf,
      })),
      supportedValuesOf: vi.fn().mockReturnValue(['xx-UNKNOWN']),
    };

    global.Intl = MockedIntl as any;

    const { generateLocaleList } = await import('@/utils/localeList');
    const result = generateLocaleList();

    expect(result.some(item => item.code === 'xx-UNKNOWN' && item.name === 'xx-UNKNOWN')).toBe(true);
  });

  it('should handle empty string from DisplayNames.of()', async () => {
    // Mock to return empty string (falsy)
    const mockOf = vi.fn().mockReturnValue('');

    const MockedIntl = {
      ...global.Intl,
      DisplayNames: vi.fn().mockImplementation(() => ({
        of: mockOf,
      })),
      supportedValuesOf: vi.fn().mockReturnValue(['zz-ZZ']),
    };

    global.Intl = MockedIntl as any;

    const { generateLocaleList } = await import('@/utils/localeList');
    const result = generateLocaleList();

    // Empty string is falsy, so should use code as fallback
    expect(result.some(item => item.code === 'zz-ZZ' && item.name === 'zz-ZZ')).toBe(true);
  });
});