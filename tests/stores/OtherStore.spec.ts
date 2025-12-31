import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useOtherStore } from "@/stores/OtherStore";
import { defaultToastTimeout, appName } from "@/utils/SystemDefaults";

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

describe("OtherStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia());

    // Clear localStorage before each test
    localStorage.clear();

    // Clear any mocks
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("Init > when no localStorage value exists, then initialize with default timeout", () => {
      const store = useOtherStore();

      expect(store.currentTimeout).toBe(defaultToastTimeout);
      expect(store.getTimeout).toBe(defaultToastTimeout);
    });

    it("Init > when there is a saved timeout from localStorage, then initialize with that value", () => {
      const savedTimeout = 5000;
      const storageKey = `${appName}.Other`;
      const savedData = { timeout: savedTimeout };

      localStorage.setItem(storageKey, JSON.stringify(savedData));

      const store = useOtherStore();

      expect(store.currentTimeout).toBe(savedTimeout);
      expect(store.getTimeout).toBe(savedTimeout);
    });

    it("Init > when the localStorage data is malformed, then use the default timeout and log an exception", async () => {
      const storageKey = `${appName}.Other`;
      localStorage.setItem(storageKey, "invalid json {");

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useOtherStore();

      await vi.dynamicImportSettled();

      expect(store.currentTimeout).toBe(defaultToastTimeout);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(SyntaxError), //JSON.parse throws a SyntaxError
        expect.objectContaining({
          module: "Other",
          action: "Hydration",
          data: "invalid json {",
        })
      );
    });

    it("Init > when the correct storage key format is used, then a valid value should be found in localStorage", () => {
      const store = useOtherStore();
      store.setTimeout(4000);

      const storageKey = `${appName}.Other`;
      const savedData = localStorage.getItem(storageKey);

      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({ timeout: 4000 });
    });
  });

  describe("setTimeout", () => {
    it("Set > when setTimeout is invoked, then the current value should be that new value", () => {
      const store = useOtherStore();
      const newTimeout = 8000;

      store.setTimeout(newTimeout);

      expect(store.currentTimeout).toBe(newTimeout);
      expect(store.getTimeout).toBe(newTimeout);
    });

    it("Set > when setTimeout is invoked, the new value should be saved to localStorage", () => {
      const store = useOtherStore();
      const newTimeout = 7500;
      const storageKey = `${appName}.Other`;

      store.setTimeout(newTimeout);

      const savedData = localStorage.getItem(storageKey);
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed).toEqual({ timeout: newTimeout });
    });

    it("Set > when there was a previous value for the timeout, the the previous value should be overwritten", () => {
      const store = useOtherStore();
      const storageKey = `${appName}.Other`;

      store.setTimeout(3000);
      expect(JSON.parse(localStorage.getItem(storageKey)!).timeout).toBe(3000);

      store.setTimeout(6000);
      expect(JSON.parse(localStorage.getItem(storageKey)!).timeout).toBe(6000);
    });

    it("Set > when the timeout is 0, it should still be written to localStorage", () => {
      const store = useOtherStore();

      store.setTimeout(0);

      expect(store.currentTimeout).toBe(0);
      expect(store.getTimeout).toBe(0);

      const storageKey = `${appName}.Other`;
      const saved = JSON.parse(localStorage.getItem(storageKey)!);
      expect(saved.timeout).toBe(0);
    });

    it("Set > when the timeout is very large, it should still be accepted", () => {
    //The app does not allow values this large at present; this is only testing that localStorage can accomodate such a large value
      const store = useOtherStore();
      const largeTimeout = 999999;

      store.setTimeout(largeTimeout);

      expect(store.currentTimeout).toBe(largeTimeout);
      expect(store.getTimeout).toBe(largeTimeout);
    });

    it("Set > when the timeout is negative, it should still be accepted", () => {
    //The app does not allow negative values and really shouldn't because a negative timeout is meaningless; this only tests that localStorage can accomodate a negative value
      const store = useOtherStore();
      const negativeTimeout = -1000;

      // Note: You might want to add validation to prevent negative values
      store.setTimeout(negativeTimeout);

      expect(store.currentTimeout).toBe(negativeTimeout);
    });
  });

  describe("getTimeout computed property", () => {
    it("Get > when the current timeout is desired, then return the current value", () => {
      const store = useOtherStore();

      expect(store.getTimeout).toBe(defaultToastTimeout);

      store.setTimeout(5000);
      expect(store.getTimeout).toBe(5000);

      store.setTimeout(10000);
      expect(store.getTimeout).toBe(10000);
    });
  });

  describe("Multiple store instances", () => {
    it("Multi > when multiple instances of the store request the data, then they should get the same data", () => {
      const store1 = useOtherStore();
      store1.setTimeout(4500);

      const store2 = useOtherStore();

      // Pinia ensures singleton behavior within the same pinia instance
      expect(store2.currentTimeout).toBe(4500);
      expect(store2.getTimeout).toBe(4500);
    });
  });

  describe("localStorage persistence across sessions", () => {
    it("Sync > when a new session begins, then the data should be the same as the previous session", () => {
      // Simulate first session
      let store = useOtherStore();
      store.setTimeout(6500);

      // Simulate new session (new pinia instance)
      setActivePinia(createPinia());
      store = useOtherStore();

      expect(store.currentTimeout).toBe(6500);
      expect(store.getTimeout).toBe(6500);
    });

    it("Sync > when localStorage is cleared, then the default timeout should be found", () => {
      const store = useOtherStore();
      store.setTimeout(5000);

      // Clear localStorage (simulating user clearing browser data)
      localStorage.clear();

      // Create new store instance
      setActivePinia(createPinia());
      const newStore = useOtherStore();

      // Should fall back to default
      expect(newStore.currentTimeout).toBe(defaultToastTimeout);
    });
  });

  describe("Edge cases", () => {
    it("Edge > when the timeout value is decimal, it should be properly handled", () => {
      //Decimal values are not currently permitted because a portion of a millisecond is not perceivable to a human user
      const store = useOtherStore();
      const decimalTimeout = 3500.75;

      store.setTimeout(decimalTimeout);

      expect(store.currentTimeout).toBe(decimalTimeout);

      // Check that it survives serialization/deserialization
      setActivePinia(createPinia());
      const newStore = useOtherStore();
      expect(newStore.currentTimeout).toBe(decimalTimeout);
    });

    it("Edge > when the localStorage quota is exceeded, then a valid timeout should be used as a default and the exception should be logged", async () => {
      const store = useOtherStore();

      // Mock localStorage.setItem to throw quota exceeded error
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      setItemSpy.mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      store.setTimeout(3.14159);

      await vi.dynamicImportSettled();

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(DOMException),
        expect.objectContaining({
          module: "Other",
          action: "Save",
          data: 3.14159,
        })
      );

      setItemSpy.mockRestore();
    });

    it("Edge > when localStorage is unavailable, an exception should be thrown", () => {
      // Mock localStorage.getItem to throw
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
      getItemSpy.mockImplementation(() => {
        throw new Error("localStorage not available");
      });

      expect(() => {
        useOtherStore();
      }).toThrow();

      getItemSpy.mockRestore();
    });
  });
});
