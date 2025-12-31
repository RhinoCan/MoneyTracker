import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useDateFormatStore } from "@/stores/DateFormatStore";
import { DateFormatTemplate } from "@/types/CommonTypes";
import { appName } from "@/utils/SystemDefaults";

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

// Mock the SystemDefaults module
vi.mock("@/utils/SystemDefaults.ts", () => ({
  defaultCountry: "US",
  appName: "TestApp",
}));

// Mock the dateFormatMapper module
vi.mock("@/utils/dateFormatMapper.ts", () => ({
  determineDateFormatFromCountry: vi.fn((countryCode: string) => {
    if (countryCode === "US") return DateFormatTemplate.USA;
    if (countryCode === "DE") return DateFormatTemplate.EUR;
    return DateFormatTemplate.ISO;
  }),
}));

describe("DateFormatStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("Init > when storage is empty, then use fallback for default country", () => {
      const store = useDateFormatStore();

      // Should use defaultCountry (US) which maps to USA format
      expect(store.currentDateFormat).toBe(DateFormatTemplate.USA);
    });

    it("Init > when localStorage has a saved format, the store should be initialized with that saved format", () => {
      const storageKey = `${appName}.DateFormat`;
      const savedData = { dateFormat: DateFormatTemplate.EUR };

      localStorage.setItem(storageKey, JSON.stringify(savedData));

      // Need to reset modules to re-run initialization
      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.EUR);
    });

    it("Init > when determineDateFormatFromCountry returns null, then use ISO fallback", async () => {
      // Mock the function to return null
      const { determineDateFormatFromCountry } = await import(
        "@/utils/dateFormatMapper.ts"
      );
      vi.mocked(determineDateFormatFromCountry).mockReturnValue(null as any);

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);
    });

    it("Init > when determineDateFormatFromCountry throws an error, then log exception and use ISO fallback", async () => {
      // 1. Arrange: Make the mapper THROW an error instead of returning a value
      const { determineDateFormatFromCountry } = await import(
        "@/utils/dateFormatMapper.ts"
      );
      vi.mocked(determineDateFormatFromCountry).mockImplementation(() => {
        throw new Error("Mapper Crash");
      });

      vi.resetModules();
      setActivePinia(createPinia());

      // 2. Act: Initialize the store
      const store = useDateFormatStore();

      // 3. Assert: Verify the recovery
      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);

      // 4. Assert: Verify the log (This hits your uncovered lines!)
      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          module: "DateFormat",
          action: "Determine fallback date format",
        })
      );
    });

    it("Init > when data from localStorage is malformed, then log the event and find a suitable fallback (2)", () => {
      const storageKey = `${appName}.DateFormat`;
      localStorage.setItem(storageKey, "invalid json {");

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(SyntaxError), //JSON.parse throws a SyntaxError
        expect.objectContaining({
          module: "DateFormat",
          action: "Read from localStorage",
          data: "invalid json {",
        })
      );

      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          "There was no saved date format; initializing with a default. The date format can be changed in the Settings dialog."
        ),
        expect.objectContaining({
          module: "DateFormat",
          action: "Initialize date format (2)",
        })
      );
    });
  });

  describe("setDateFormat", () => {
    it("Set > when setDateFormat is called, then update activeDateFormat", () => {
      const store = useDateFormatStore();

      store.setDateFormat(DateFormatTemplate.ISO);

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);
    });

    it("Set > when setDateFormat is called, then persist format to localStorage", () => {
      const store = useDateFormatStore();
      const storageKey = `${appName}.DateFormat`;

      store.setDateFormat(DateFormatTemplate.EUR);

      const savedData = localStorage.getItem(storageKey);
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed).toEqual({ dateFormat: DateFormatTemplate.EUR });
    });

    it("Set > when setDateFormat is called for a second time, then overwrite previous localStorage values", () => {
      const store = useDateFormatStore();
      const storageKey = `${appName}.DateFormat`;

      store.setDateFormat(DateFormatTemplate.USA);
      expect(JSON.parse(localStorage.getItem(storageKey)!).dateFormat).toBe(
        DateFormatTemplate.USA
      );

      store.setDateFormat(DateFormatTemplate.EUR);
      expect(JSON.parse(localStorage.getItem(storageKey)!).dateFormat).toBe(
        DateFormatTemplate.EUR
      );
    });

    it("Set > when setDateFormat is called, then store all DateFormatTemplate values correctly", () => {
      const store = useDateFormatStore();

      const formats = [
        DateFormatTemplate.ISO,
        DateFormatTemplate.USA,
        DateFormatTemplate.EUR,
      ];

      formats.forEach((format) => {
        store.setDateFormat(format);
        expect(store.currentDateFormat).toBe(format);
      });
    });

    it("Set > when storing date format, then it should be findable again via the same key", () => {
      const store = useDateFormatStore();
      store.setDateFormat(DateFormatTemplate.EUR);

      const storageKey = `${appName}.DateFormat`;
      const savedData = localStorage.getItem(storageKey);

      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({
        dateFormat: DateFormatTemplate.EUR,
      });
    });
  });

  describe("Sync and Persistence across sessions", () => {
    it("Sync > when different instances of the same store occur, then all instances should the same data", () => {
      const store1 = useDateFormatStore();
      store1.setDateFormat(DateFormatTemplate.EUR);

      const store2 = useDateFormatStore();

      expect(store2.currentDateFormat).toBe(DateFormatTemplate.EUR);
    });

    it("Sync > when a new session is created, then store values should restore format from localStorage", () => {
      let store = useDateFormatStore();
      store.setDateFormat(DateFormatTemplate.ISO);

      // Simulate new session
      vi.resetModules();
      setActivePinia(createPinia());
      store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);
    });

    it("Sync - when localStorage is cleared, then store should handle re-importing of modules gracefully", async () => {
      const store = useDateFormatStore();
      store.setDateFormat(DateFormatTemplate.EUR);

      localStorage.clear();

      vi.resetModules();
      setActivePinia(createPinia());

      // Need to re-import the mocked module after resetModules
      const { determineDateFormatFromCountry } = await import(
        "@/utils/dateFormatMapper.ts"
      );
      vi.mocked(determineDateFormatFromCountry).mockReturnValue(
        DateFormatTemplate.USA
      );

      const newStore = useDateFormatStore();

      // Should fall back to system default (USA)
      expect(newStore.currentDateFormat).toBe(DateFormatTemplate.USA);
    });
  });

  describe("Integration with determineDateFormatFromCountry", () => {
    it("Integration > when there is no stored value in localStorage, then the store should call determineDateFormatFromCountry with defaultCountry on initialization", async () => {
      const { determineDateFormatFromCountry } = await import(
        "@/utils/dateFormatMapper.ts"
      );

      vi.resetModules();
      setActivePinia(createPinia());
      useDateFormatStore();

      expect(determineDateFormatFromCountry).toHaveBeenCalledWith("US");
    });

    it("Integration > when there is a stored value, then the store should not call determineDateFormatFromCountry", async () => {
      const storageKey = `${appName}.DateFormat`;
      const savedData = { dateFormat: DateFormatTemplate.EUR };
      localStorage.setItem(storageKey, JSON.stringify(savedData));

      const { determineDateFormatFromCountry } = await import(
        "@/utils/dateFormatMapper.ts"
      );
      vi.mocked(determineDateFormatFromCountry).mockClear();

      vi.resetModules();
      setActivePinia(createPinia());
      useDateFormatStore();

      // Should use localStorage value instead of calling the mapper
      expect(determineDateFormatFromCountry).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("Edge > when localStorage quota is exceeded, then the store should handle this by logging an exception", () => {
      const store = useDateFormatStore();

      const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
      setItemSpy.mockImplementation(() => {
        throw new DOMException("QuotaExceededError");
      });

      store.setDateFormat(DateFormatTemplate.ISO);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(DOMException),
        expect.objectContaining({
          module: "DateFormat",
          action: "update",
          data: "yyyy-MM-dd",
        })
      );
      setItemSpy.mockRestore();
    });

    it("Edge > when there are invalid DateFormatTemplate values in localStorage, then fall back to that format at run time", () => {
      const storageKey = `${appName}.DateFormat`;
      const invalidData = { dateFormat: "invalid-format" };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      // TypeScript casting will accept it, so it will be stored as-is
      expect(store.currentDateFormat).toBe("invalid-format");
    });

    it("Edge > when there is a missing dateFormat property in localStorage, use fallback format (1) and log warning", () => {
      const storageKey = `${appName}.DateFormat`;
      const invalidData = { wrongProperty: "value" };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining("There was no saved date format; initializing with a default. The date format can be changed in the Settings dialog."),
        expect.objectContaining({
          module: "DateFormat",
          action: "Initialize date format (1)",
        })
      );
    });

    it("Edge > when the local storage key does not exist, then use the system-derived fallback (3) and log warning", () => {
      const storageKey = `${appName}.DateFormat`;
      localStorage.removeItem(storageKey);

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.USA);

      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining(
          "There was no saved date format; initializing with a default. The date format can be changed in the Settings dialog."
        ),
        expect.objectContaining({
          module: "DateFormat",
          action: "Initialize date format (3)",
        })
      );
    });
  });

  describe("State reactivity", () => {
    it("Reactivity > when format changes, then reactive updates should be triggered", () => {
      const store = useDateFormatStore();
      const initialFormat = store.currentDateFormat;

      // Change to a different format
      const newFormat =
        initialFormat === DateFormatTemplate.ISO
          ? DateFormatTemplate.EUR
          : DateFormatTemplate.ISO;

      store.setDateFormat(newFormat);

      expect(store.currentDateFormat).not.toBe(initialFormat);
      expect(store.currentDateFormat).toBe(newFormat);
    });

    it("Reactivity > when the same format is changed multiple times, then that should work", () => {
      const store = useDateFormatStore();

      store.setDateFormat(DateFormatTemplate.USA);
      store.setDateFormat(DateFormatTemplate.USA);
      store.setDateFormat(DateFormatTemplate.USA);

      expect(store.currentDateFormat).toBe(DateFormatTemplate.USA);
    });
  });
});
