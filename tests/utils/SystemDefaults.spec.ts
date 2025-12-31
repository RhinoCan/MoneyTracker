import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoist the mock functions so they're available to the mock factory
const { mockLogException, mockLogWarning, mockLogInfo, mockLogSuccess } = vi.hoisted(() => ({
  mockLogException: vi.fn(),
  mockLogWarning: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogSuccess: vi.fn(),
}));

// Mock the Logger module using the hoisted functions
vi.mock('@/utils/Logger', () => ({
  logException: mockLogException,
  logWarning: mockLogWarning,
  logInfo: mockLogInfo,
  logSuccess: mockLogSuccess,
}));

describe("SystemDefaults - Error Handling", () => {
  let originalIntlNumberFormat: typeof Intl.NumberFormat;
  let consoleWarnSpy: any;

  beforeEach(() => {
    // Save the original Intl.NumberFormat
    originalIntlNumberFormat = Intl.NumberFormat;

    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore everything
    global.Intl.NumberFormat = originalIntlNumberFormat;
    consoleWarnSpy.mockRestore();

    // Clear module cache to allow re-import
    vi.resetModules();
  });

  it('uses the VITE_APP_NAME from environment variables', async () => {
  // 1. Set the mock value
  import.meta.env.VITE_APP_NAME = 'custom-app';

  // 2. Clear module cache and re-import
  vi.resetModules();
  const { appName } = await import('@/utils/SystemDefaults');

  expect(appName).toBe('custom-app');
});

it('falls back to "money-tracker" when VITE_APP_NAME is undefined', async () => {
  // 1. Force it to undefined
  import.meta.env.VITE_APP_NAME = '';

  // 2. Clear module cache and re-import
  vi.resetModules();
  const { appName } = await import('@/utils/SystemDefaults');

  expect(appName).toBe('money-tracker');
});

  it("falls back to USD when Intl.NumberFormat throws an error", async () => {
    // Mock Intl.NumberFormat to throw an error
    global.Intl.NumberFormat = vi.fn().mockImplementation(() => {
      throw new Error("Mock Intl.NumberFormat error");
    }) as any;

    // Re-import the module to trigger the initialization code with our mock
    const SystemDefaults = await import("@/utils/SystemDefaults");

    // Should fall back to USD
    expect(SystemDefaults.defaultCurrencyCode).toBe("USD");

    // Should have logged a warning
    // expect(consoleWarnSpy).toHaveBeenCalledWith(
    //   expect.stringContaining(
    //     "[SystemDefaults] Failed to determine default currency"
    //   ),
    //   expect.any(Error)
    // );

    expect(mockLogException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ action: "fallback currency", data: 'USD' })
    );
  });

  it("successfully determines currency when Intl.NumberFormat works", async () => {
    // Mock Intl.NumberFormat to work properly
    const mockResolvedOptions = vi.fn().mockReturnValue({ currency: "EUR" });
    global.Intl.NumberFormat = vi.fn().mockImplementation(() => ({
      resolvedOptions: mockResolvedOptions,
      format: vi.fn(),
    })) as any;

    // Re-import the module
    const SystemDefaults = await import("@/utils/SystemDefaults");

    // Should use the resolved currency
    expect(SystemDefaults.defaultCurrencyCode).toBe("EUR");

    // Should NOT have logged a warning
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("falls back to USD when resolvedOptions returns null currency", async () => {
    // Mock Intl.NumberFormat to return null currency
    const mockResolvedOptions = vi.fn().mockReturnValue({ currency: null });
    global.Intl.NumberFormat = vi.fn().mockImplementation(() => ({
      resolvedOptions: mockResolvedOptions,
      format: vi.fn(),
    })) as any;

    // Re-import the module
    const SystemDefaults = await import("@/utils/SystemDefaults");

    // Should fall back to USD due to nullish coalescing
    expect(SystemDefaults.defaultCurrencyCode).toBe("USD");
  });

  it("falls back to USD when resolvedOptions returns undefined currency", async () => {
    // Mock Intl.NumberFormat to return undefined currency
    const mockResolvedOptions = vi
      .fn()
      .mockReturnValue({ currency: undefined });
    global.Intl.NumberFormat = vi.fn().mockImplementation(() => ({
      resolvedOptions: mockResolvedOptions,
      format: vi.fn(),
    })) as any;

    // Re-import the module
    const SystemDefaults = await import("@/utils/SystemDefaults");

    // Should fall back to USD due to nullish coalescing
    expect(SystemDefaults.defaultCurrencyCode).toBe("USD");
  });
});

describe("SystemDefaults - Locale and Country Extraction", () => {
  let originalNavigator: Navigator;

  beforeEach(() => {
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });

    // Clear module cache
    vi.resetModules();
  });

  it("extracts country from locale with region", async () => {
    // Mock navigator.language
    Object.defineProperty(global, "navigator", {
      value: { language: "fr-CA" },
      writable: true,
      configurable: true,
    });

    const SystemDefaults = await import("@/utils/SystemDefaults");

    expect(SystemDefaults.defaultLocale).toBe("fr-CA");
    expect(SystemDefaults.defaultCountry).toBe("CA");
  });

  it("defaults to US when locale has no region", async () => {
    // Mock navigator.language without region
    Object.defineProperty(global, "navigator", {
      value: { language: "en" },
      writable: true,
      configurable: true,
    });

    const SystemDefaults = await import("@/utils/SystemDefaults");

    expect(SystemDefaults.defaultLocale).toBe("en");
    expect(SystemDefaults.defaultCountry).toBe("US");
  });

  it("falls back to en-US when navigator.language is undefined", async () => {
    // Mock navigator.language as undefined
    Object.defineProperty(global, "navigator", {
      value: { language: undefined },
      writable: true,
      configurable: true,
    });

    const SystemDefaults = await import("@/utils/SystemDefaults");

    expect(SystemDefaults.defaultLocale).toBe("en-US");
    expect(SystemDefaults.defaultCountry).toBe("US");
  });

  it("handles locale with multiple parts correctly", async () => {
    // Some locales might have script codes like zh-Hans-CN
    Object.defineProperty(global, "navigator", {
      value: { language: "zh-Hans-CN" },
      writable: true,
      configurable: true,
    });

    const SystemDefaults = await import("@/utils/SystemDefaults");

    expect(SystemDefaults.defaultLocale).toBe("zh-Hans-CN");
    // Should take the last part and uppercase it
    expect(SystemDefaults.defaultCountry).toBe("CN");
  });
});

describe("SystemDefaults - Constants Verification", () => {
  it("exports correct default formatting options", async () => {
    const SystemDefaults = await import("@/utils/SystemDefaults");

    expect(SystemDefaults.defaultMinPrecision).toBe(2);
    expect(SystemDefaults.defaultMaxPrecision).toBe(2);
    expect(SystemDefaults.defaultThousandsSeparator).toBe(true);
    expect(SystemDefaults.defaultUseBankersRounding).toBe(false);
    expect(SystemDefaults.defaultNegativeZero).toBe(true);
    expect(SystemDefaults.defaultCurrencyDisplay).toBe("symbol");
    expect(SystemDefaults.defaultCurrencySign).toBe("standard");
  });
});
