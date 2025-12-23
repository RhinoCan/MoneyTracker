import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useOtherStore } from "@/stores/OtherStore";
import { defaultToastTimeout, appName } from "@/utils/SystemDefaults";

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
    it("should initialize with default timeout when no localStorage value exists", () => {
      const store = useOtherStore();

      expect(store.currentTimeout).toBe(defaultToastTimeout);
      expect(store.getTimeout).toBe(defaultToastTimeout);
    });

    it("should initialize with saved timeout from localStorage", () => {
      const savedTimeout = 5000;
      const storageKey = `${appName}.Other`;
      const savedData = { timeout: savedTimeout };

      localStorage.setItem(storageKey, JSON.stringify(savedData));

      const store = useOtherStore();

      expect(store.currentTimeout).toBe(savedTimeout);
      expect(store.getTimeout).toBe(savedTimeout);
    });

    it("should handle malformed localStorage data gracefully", () => {
      const storageKey = `${appName}.Other`;
      localStorage.setItem(storageKey, "invalid json {");

      // Should either throw or fall back to defaults
      // Depending on your error handling preference
      expect(() => {
        useOtherStore();
      }).toThrow();
    });

    it("should use correct storage key format", () => {
      const store = useOtherStore();
      store.setTimeout(4000);

      const storageKey = `${appName}.Other`;
      const savedData = localStorage.getItem(storageKey);

      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({ timeout: 4000 });
    });
  });

  describe("setTimeout", () => {
    it("should update currentTimeout when setTimeout is called", () => {
      const store = useOtherStore();
      const newTimeout = 8000;

      store.setTimeout(newTimeout);

      expect(store.currentTimeout).toBe(newTimeout);
      expect(store.getTimeout).toBe(newTimeout);
    });

    it("should persist timeout to localStorage when setTimeout is called", () => {
      const store = useOtherStore();
      const newTimeout = 7500;
      const storageKey = `${appName}.Other`;

      store.setTimeout(newTimeout);

      const savedData = localStorage.getItem(storageKey);
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed).toEqual({ timeout: newTimeout });
    });

    it("should overwrite previous localStorage values", () => {
      const store = useOtherStore();
      const storageKey = `${appName}.Other`;

      store.setTimeout(3000);
      expect(JSON.parse(localStorage.getItem(storageKey)!).timeout).toBe(3000);

      store.setTimeout(6000);
      expect(JSON.parse(localStorage.getItem(storageKey)!).timeout).toBe(6000);
    });

    it("should handle zero timeout", () => {
      const store = useOtherStore();

      store.setTimeout(0);

      expect(store.currentTimeout).toBe(0);
      expect(store.getTimeout).toBe(0);

      const storageKey = `${appName}.Other`;
      const saved = JSON.parse(localStorage.getItem(storageKey)!);
      expect(saved.timeout).toBe(0);
    });

    it("should handle large timeout values", () => {
      const store = useOtherStore();
      const largeTimeout = 999999;

      store.setTimeout(largeTimeout);

      expect(store.currentTimeout).toBe(largeTimeout);
      expect(store.getTimeout).toBe(largeTimeout);
    });

    it("should handle negative timeout values (if allowed)", () => {
      const store = useOtherStore();
      const negativeTimeout = -1000;

      // Note: You might want to add validation to prevent negative values
      store.setTimeout(negativeTimeout);

      expect(store.currentTimeout).toBe(negativeTimeout);
    });
  });

  describe("getTimeout computed property", () => {
    it("should reactively return current timeout value", () => {
      const store = useOtherStore();

      expect(store.getTimeout).toBe(defaultToastTimeout);

      store.setTimeout(5000);
      expect(store.getTimeout).toBe(5000);

      store.setTimeout(10000);
      expect(store.getTimeout).toBe(10000);
    });
  });

  describe("Multiple store instances", () => {
    it("should share state across multiple store instances", () => {
      const store1 = useOtherStore();
      store1.setTimeout(4500);

      const store2 = useOtherStore();

      // Pinia ensures singleton behavior within the same pinia instance
      expect(store2.currentTimeout).toBe(4500);
      expect(store2.getTimeout).toBe(4500);
    });
  });

  describe("localStorage persistence across sessions", () => {
    it("should restore timeout from localStorage in new session", () => {
      // Simulate first session
      let store = useOtherStore();
      store.setTimeout(6500);

      // Simulate new session (new pinia instance)
      setActivePinia(createPinia());
      store = useOtherStore();

      expect(store.currentTimeout).toBe(6500);
      expect(store.getTimeout).toBe(6500);
    });

    it("should handle cleared localStorage gracefully", () => {
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
    it("should handle decimal timeout values", () => {
      const store = useOtherStore();
      const decimalTimeout = 3500.75;

      store.setTimeout(decimalTimeout);

      expect(store.currentTimeout).toBe(decimalTimeout);

      // Check that it survives serialization/deserialization
      setActivePinia(createPinia());
      const newStore = useOtherStore();
      expect(newStore.currentTimeout).toBe(decimalTimeout);
    });

    it("should handle localStorage quota exceeded gracefully", () => {
      const store = useOtherStore();

      // Mock localStorage.setItem to throw quota exceeded error
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      setItemSpy.mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      // Depending on your error handling, this might throw or fail silently
      // Adjust this test based on your desired behavior
      expect(() => {
        store.setTimeout(5000);
      }).toThrow();

      setItemSpy.mockRestore();
    });

    it("should handle localStorage being unavailable", () => {
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