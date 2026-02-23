// __tests__/utils/localeList.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logException } from "@/utils/Logger.ts";
import { generateLocaleList } from "@/utils/localeList";

vi.mock("@/utils/Logger", () => ({
  logException: vi.fn(),
  logWarning: vi.fn(),
  logSuccess: vi.fn(),
}));

describe("localeList Utility", () => {
  let originalIntl: typeof Intl;

  beforeEach(() => {
    originalIntl = global.Intl;

    // Silence console.log and error to hide the "Intl.supportedValuesOf" noise
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.resetModules(); // Vital because the file runs generateLocaleList() on load
  });

  afterEach(() => {
    global.Intl = originalIntl;
    vi.restoreAllMocks();
  });

  // --- GROUP 1: STANDARD OPERATION ---
  describe("Successful Generation", () => {
    it("should export a sorted list of locales", async () => {
      const { localeList } = await import("@/utils/localeList");
      expect(Array.isArray(localeList)).toBe(true);
      expect(localeList.length).toBeGreaterThan(10);

      // Verify sorting (A-Z)
      const names = localeList.map((l) => l.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });

    it("should ensure the structure is correct (code and name)", async () => {
      const { localeList } = await import("@/utils/localeList");
      const item = localeList[0];
      expect(item).toHaveProperty("code");
      expect(item).toHaveProperty("name");
    });
  });

  // --- GROUP 2: EXCEPTION BRANCHES (The Catch Blocks) ---
  describe("Error Handling and Fallbacks", () => {
    it("should use minimal fallback when Intl.DisplayNames fails (Line 15)", async () => {
      const MockedIntl = {
        ...global.Intl,
        DisplayNames: vi.fn().mockImplementation(() => {
          throw new Error("DisplayNames not supported");
        }),
      };
      global.Intl = MockedIntl as any;

      const { generateLocaleList } = await import("@/utils/localeList");
      const result = generateLocaleList();

      expect(result).toEqual([{ code: "en-US", name: "English (US)" }]);
    });

    it("should use hardcoded list when supportedValuesOf fails (Line 25)", async () => {
      const MockedIntl = {
        ...global.Intl,
        DisplayNames: vi.fn().mockImplementation(() => ({
          of: (code: string) => `Name-${code}`,
        })),
        supportedValuesOf: vi.fn().mockImplementation(() => {
          throw new Error("API Missing");
        }),
      };
      global.Intl = MockedIntl as any;

      const { generateLocaleList } = await import("@/utils/localeList");
      const result = generateLocaleList();

      expect(result.some((l) => l.code === "en-US")).toBe(true);
      expect(result.some((l) => l.code === "hi-IN")).toBe(true);
    });

    it("should use code as name if display.of() throws (Line 40)", async () => {
      const MockedIntl = {
        ...global.Intl,
        DisplayNames: vi.fn().mockImplementation(() => ({
          of: () => {
            throw new Error("Parsing Error");
          },
        })),
        supportedValuesOf: vi.fn().mockReturnValue(["en-US"]),
      };
      global.Intl = MockedIntl as any;

      const { generateLocaleList } = await import("@/utils/localeList");
      const result = generateLocaleList();

      expect(result[0]).toEqual({ code: "en-US", name: "en-US" });
    });
  });

  // --- GROUP 3: VALUE FALLBACKS ---
  describe("Display Name Fallbacks", () => {
    it("should use code as name when display.of() returns null/falsy", async () => {
      const MockedIntl = {
        ...global.Intl,
        DisplayNames: vi.fn().mockImplementation(() => ({
          of: () => null,
        })),
        supportedValuesOf: vi.fn().mockReturnValue(["fr-FR"]),
      };
      global.Intl = MockedIntl as any;

      const { generateLocaleList } = await import("@/utils/localeList");
      const result = generateLocaleList();

      expect(result[0].name).toBe("fr-FR");
    });
  });

  describe("localeList initialization", () => {
    beforeEach(() => {
      vi.resetModules(); // Essential: clears the 'cache' of the imported module
      vi.clearAllMocks();
    });

    it("falls back to hardcoded list and logs exception when Intl.supportedValuesOf fails", async () => {
      // 1. Break the API
      const spy = vi.spyOn(Intl, "supportedValuesOf" as any).mockImplementation(() => {
        throw new Error("Intl Failure");
      });

      // 2. Re-import the module to trigger the top-level 'generateLocaleList'
      const { localeList } = await import("@/utils/localeList");

      // 3. Assertions
      expect(localeList.length).toBe(14); // Matches your hardcoded list length
      const codes = localeList.map((l) => l.code);
      expect(codes).toContain("ar-SA");
      expect(codes).toContain("en-US");
      expect(logException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ module: "localeList" })
      );

      spy.mockRestore();
    });

    it("returns the absolute minimal fallback if Intl.DisplayNames constructor fails", async () => {
      // 1. Break the DisplayNames constructor specifically
      const spy = vi.spyOn(Intl, "DisplayNames").mockImplementation(() => {
        throw new Error("DisplayNames Not Supported");
      });

      // 2. Re-import to trigger initialization
      const { localeList } = await import("@/utils/localeList");

      // 3. Verify the immediate return fallback
      expect(localeList).toEqual([{ code: "en-US", name: "English (US)" }]);
      expect(localeList.length).toBe(1);

      spy.mockRestore();
    });

    it("throws and handles 'API not supported' when supportedValuesOf is missing", () => {
      // 1. Temporarily hide the method from Intl
      const originalMethod = Intl.supportedValuesOf;
      // @ts-ignore - deleting for the sake of the test path
      delete (Intl as any).supportedValuesOf;

      // 2. This should now trigger the 'else' block -> throw error -> catch block
      const list = generateLocaleList();

      // 3. Verify it still returns our fallback list
      expect(list.length).toBeGreaterThan(0);
      expect(list.some((l) => l.code === "en-US")).toBe(true);

      // 4. Restore the method so other tests don't break
      Intl.supportedValuesOf = originalMethod;
    });
  });
});
