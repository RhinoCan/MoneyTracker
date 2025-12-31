// tests/utils/Logger.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from "@sentry/vue";
import { useOtherStore } from "@/stores/OtherStore";

// Force Vitest to use the real file logic for this spec
vi.unmock('@/utils/Logger');

// 1. Setup global mocks for dependencies
vi.mock("@sentry/vue", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@/stores/OtherStore", () => ({
  useOtherStore: vi.fn(),
}));

const mockToastFunctions = {
  error: vi.fn(),
  warning: vi.fn(),
  success: vi.fn(),
};

vi.mock("vue-toastification", () => ({
  useToast: vi.fn(() => mockToastFunctions),
}));

describe('Logger Utility', () => {
  let Logger: any;

  beforeEach(async () => {
    // Clear all previous mock data
    vi.clearAllMocks();
    vi.resetModules();

    // Silence the console inside the tests to hide the 🟠 emojis
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Default mock behavior for the store
    vi.mocked(useOtherStore).mockReturnValue({ getTimeout: 5000 } as any);

    // Re-import the real Logger so it uses the mocks defined above
    Logger = await import('@/utils/Logger');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should report to Sentry and show an error toast', () => {
    const error = new Error('Test Error');
    const context = { module: 'TestMod', action: 'TestAction' };

    Logger.logException(error, context);

    expect(Sentry.captureException).toHaveBeenCalled();
    expect(mockToastFunctions.error).toHaveBeenCalledWith(
      expect.stringContaining('TestMod'),
      expect.objectContaining({ timeout: 5000 })
    );
  });

  it('should report a warning message to Sentry and show a toast', () => {
    const msg = 'Careful now';
    const context = { module: 'WarnMod', action: 'WarnAction' };

    Logger.logWarning(msg, context);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(msg, expect.objectContaining({ level: 'warning' }));
    expect(mockToastFunctions.warning).toHaveBeenCalledWith(msg, { timeout: 5000 });
  });

  it('should only trigger a success toast', () => {
    Logger.logSuccess('Yay!');
    expect(mockToastFunctions.success).toHaveBeenCalledWith('Yay!', { timeout: 5000 });
  });

  describe('getSafeTimeout Fallbacks', () => {
    it('should fallback to 0 if the store throws (Line 15-17)', () => {
      vi.mocked(useOtherStore).mockImplementation(() => {
        throw new Error('Pinia Error');
      });

      Logger.logSuccess('Fallback Test');
      expect(mockToastFunctions.success).toHaveBeenCalledWith('Fallback Test', { timeout: 0 });
    });

    it('should return 0 if store returns null (Line 13)', () => {
      vi.mocked(useOtherStore).mockReturnValue(null as any);
      Logger.logSuccess('Null Store Test');
      expect(mockToastFunctions.success).toHaveBeenCalledWith('Null Store Test', { timeout: 0 });
    });
  });
});