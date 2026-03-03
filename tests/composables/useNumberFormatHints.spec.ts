// tests/composables/useNumberFormatHints.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingsStore } from "@/stores/SettingsStore";
import { withSetup } from "../test-utils";
import { useNumberFormatHints } from "@/composables/useNumberFormatHints";

vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
      t: (key: string) => key,
      te: () => false,
    },
  },
}));

describe("useNumberFormatHints", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // -------------------------------------------------------------------------
  // decimalSeparator
  // -------------------------------------------------------------------------
  describe("decimalSeparator", () => {
    it("is '.' for en-US", () => {
      const { decimalSeparator } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useNumberFormatHints();
      });
      expect(decimalSeparator.value).toBe(".");
    });

    it("is ',' for de-DE", () => {
      const { decimalSeparator } = withSetup(() => {
        useSettingsStore().locale = "de-DE";
        return useNumberFormatHints();
      });
      expect(decimalSeparator.value).toBe(",");
    });

    it("is ',' for fr-FR", () => {
      const { decimalSeparator } = withSetup(() => {
        useSettingsStore().locale = "fr-FR";
        return useNumberFormatHints();
      });
      expect(decimalSeparator.value).toBe(",");
    });
  });

  // -------------------------------------------------------------------------
  // groupSeparator
  // -------------------------------------------------------------------------
  describe("groupSeparator", () => {
    it("is ',' for en-US", () => {
      const { groupSeparator } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useNumberFormatHints();
      });
      expect(groupSeparator.value).toBe(",");
    });

    it("is '.' for de-DE", () => {
      const { groupSeparator } = withSetup(() => {
        useSettingsStore().locale = "de-DE";
        return useNumberFormatHints();
      });
      expect(groupSeparator.value).toBe(".");
    });
  });

  // -------------------------------------------------------------------------
  // amountExample
  // -------------------------------------------------------------------------
  describe("amountExample", () => {
    it("formats 1234.56 correctly for en-US", () => {
      const { amountExample } = withSetup(() => {
        useSettingsStore().locale = "en-US";
        return useNumberFormatHints();
      });
      expect(amountExample.value).toMatch(/1,234\.56/);
    });

    it("formats 1234.56 correctly for de-DE", () => {
      const { amountExample } = withSetup(() => {
        useSettingsStore().locale = "de-DE";
        return useNumberFormatHints();
      });
      expect(amountExample.value).toMatch(/1\.234,56/);
    });
  });

  // -------------------------------------------------------------------------
  // hasCorrectSeparator
  // -------------------------------------------------------------------------
  describe("hasCorrectSeparator", () => {
    describe("en-US (decimal: '.')", () => {
      it("returns true for a value with no separator", () => {
        const { hasCorrectSeparator } = withSetup(() => {
          useSettingsStore().locale = "en-US";
          return useNumberFormatHints();
        });
        expect(hasCorrectSeparator("100")).toBe(true);
      });

      it("returns true for a value using '.' as decimal", () => {
        const { hasCorrectSeparator } = withSetup(() => {
          useSettingsStore().locale = "en-US";
          return useNumberFormatHints();
        });
        expect(hasCorrectSeparator("100.50")).toBe(true);
      });

      it("returns false for a value using ',' as decimal", () => {
        const { hasCorrectSeparator } = withSetup(() => {
          useSettingsStore().locale = "en-US";
          return useNumberFormatHints();
        });
        expect(hasCorrectSeparator("100,50")).toBe(false);
      });

      it("returns true for empty string", () => {
        const { hasCorrectSeparator } = withSetup(() => {
          useSettingsStore().locale = "en-US";
          return useNumberFormatHints();
        });
        expect(hasCorrectSeparator("")).toBe(true);
      });
    });

    describe("de-DE (decimal: ',')", () => {
      it("returns true for a value using ',' as decimal", () => {
        const { hasCorrectSeparator } = withSetup(() => {
          useSettingsStore().locale = "de-DE";
          return useNumberFormatHints();
        });
        expect(hasCorrectSeparator("100,50")).toBe(true);
      });

      it("returns false for a value using '.' as decimal", () => {
        const { hasCorrectSeparator } = withSetup(() => {
          useSettingsStore().locale = "de-DE";
          return useNumberFormatHints();
        });
        expect(hasCorrectSeparator("100.50")).toBe(false);
      });
    });
  });
});
