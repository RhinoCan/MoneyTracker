// tests/utils/localeList.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateLocaleList } from "@/utils/localeList";

describe("generateLocaleList", () => {
  // -------------------------------------------------------------------------
  // Basic structure
  // -------------------------------------------------------------------------
  describe("return structure", () => {
    it("returns an array", () => {
      const result = generateLocaleList();
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns items with 'code' and 'name' string properties", () => {
      const result = generateLocaleList();
      expect(result.length).toBeGreaterThan(0);
      result.forEach((item) => {
        expect(typeof item.code).toBe("string");
        expect(typeof item.name).toBe("string");
        expect(item.code.length).toBeGreaterThan(0);
        expect(item.name.length).toBeGreaterThan(0);
      });
    });

    it("returns items sorted alphabetically by name", () => {
      const result = generateLocaleList();
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].name.localeCompare(result[i].name)).toBeLessThanOrEqual(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // display.of() returns falsy for a specific code (line 98)
  // -------------------------------------------------------------------------
  describe("display.of() returns falsy for individual locale", () => {
    it("falls back to the raw code as the name when of() returns undefined", () => {
      const original = Intl.DisplayNames.prototype.of;
      Intl.DisplayNames.prototype.of = function (code: string | undefined) {
        if (code === "en-US") return undefined as unknown as string;
        return original.call(this, code!);
      };

      const result = generateLocaleList();
      const enUS = result.find((item) => item.code === "en-US");
      expect(enUS?.name).toBe("en-US");

      Intl.DisplayNames.prototype.of = original;
    });
  });

  // -------------------------------------------------------------------------
  // Supported language filtering
  // -------------------------------------------------------------------------
  describe("supported language filtering", () => {
    it("only returns locales whose base language is in the supported list", () => {
      const supported = ["en", "fr", "es", "de", "zh", "ja", "ko", "hi", "ar", "ru", "pt", "it"];
      const result = generateLocaleList();
      result.forEach((item) => {
        const base = item.code.split("-")[0].toLowerCase();
        expect(supported).toContain(base);
      });
    });

    it("does not contain locales for unsupported languages like Swedish (sv)", () => {
      const result = generateLocaleList();
      const codes = result.map((item) => item.code);
      const hasSv = codes.some((c) => c.startsWith("sv"));
      expect(hasSv).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // displayLocale parameter
  // -------------------------------------------------------------------------
  describe("displayLocale parameter", () => {
    it("defaults to English display names", () => {
      const result = generateLocaleList();
      // en-US should have an English name containing "English"
      const enUS = result.find((item) => item.code === "en-US");
      expect(enUS?.name).toMatch(/English/i);
    });

    it("uses the provided displayLocale for names", () => {
      const resultEn = generateLocaleList("en");
      const resultFr = generateLocaleList("fr");
      // The two lists should differ in their display names
      const enNames = resultEn.map((i) => i.name).join();
      const frNames = resultFr.map((i) => i.name).join();
      expect(enNames).not.toBe(frNames);
    });
  });

  // -------------------------------------------------------------------------
  // Fallback behaviour when Intl.supportedValuesOf is unavailable
  // -------------------------------------------------------------------------
  describe("fallback when Intl.supportedValuesOf is unavailable", () => {
    let originalSupportedValuesOf: typeof Intl.supportedValuesOf;

    beforeEach(() => {
      originalSupportedValuesOf = Intl.supportedValuesOf;
      // @ts-ignore — intentionally removing to test fallback path
      delete Intl.supportedValuesOf;
    });

    afterEach(() => {
      Intl.supportedValuesOf = originalSupportedValuesOf;
    });

    it("still returns a non-empty array using the hard-coded fallback", () => {
      const result = generateLocaleList();
      expect(result.length).toBeGreaterThan(0);
    });

    it("fallback list includes en-US", () => {
      const result = generateLocaleList();
      const codes = result.map((i) => i.code);
      expect(codes).toContain("en-US");
    });

    it("fallback list only contains supported language codes", () => {
      const supported = ["en", "fr", "es", "de", "zh", "ja", "ko", "hi", "ar", "ru", "pt", "it"];
      const result = generateLocaleList();
      result.forEach((item) => {
        const base = item.code.split("-")[0].toLowerCase();
        expect(supported).toContain(base);
      });
    });
  });

  // -------------------------------------------------------------------------
  // Fallback when Intl.DisplayNames constructor throws
  // -------------------------------------------------------------------------
  describe("fallback when Intl.DisplayNames throws", () => {
    it("returns the single en-US fallback item", () => {
      const spy = vi.spyOn(global.Intl, "DisplayNames").mockImplementation(() => {
        throw new Error("Not supported");
      });

      const result = generateLocaleList("en");
      expect(result).toEqual([{ code: "en-US", name: "English (US)" }]);

      spy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // display.of() throws for a specific code (lines 101–102)
  // -------------------------------------------------------------------------
  describe("display.of() throws for individual locale", () => {
    it("falls back to using the raw code as the name", () => {
      const original = Intl.DisplayNames.prototype.of;
      Intl.DisplayNames.prototype.of = (code: string | undefined) => {
        if (code === "en-US") throw new Error("of() failed");
        return original.call(this, code!);
      };

      const result = generateLocaleList();
      const enUS = result.find((item) => item.code === "en-US");
      expect(enUS?.name).toBe("en-US");

      Intl.DisplayNames.prototype.of = original;
    });
  });
});
