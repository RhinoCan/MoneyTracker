// tests/composables/useDateFormatter.spec.ts
import { describe, it, expect } from "vitest";
import { withSetup } from "../test-utils";
import { useDateFormatter } from "@/composables/useDateFormatter";

// useDateFormatter uses useI18n() internally, so it must be called within a
// Vue app context. We use a minimal withSetup helper for this.

describe("useDateFormatter", () => {
  // -------------------------------------------------------------------------
  // formatToIsoDateOnly
  // -------------------------------------------------------------------------
  describe("formatToIsoDateOnly", () => {
    it("formats a date to YYYY-MM-DD", () => {
      const { formatToIsoDateOnly } = withSetup(() => useDateFormatter());
      const date = new Date(2025, 5, 15); // June 15, 2025
      expect(formatToIsoDateOnly(date)).toBe("2025-06-15");
    });

    it("pads single-digit month with a leading zero", () => {
      const { formatToIsoDateOnly } = withSetup(() => useDateFormatter());
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(formatToIsoDateOnly(date)).toBe("2025-01-05");
    });

    it("pads single-digit day with a leading zero", () => {
      const { formatToIsoDateOnly } = withSetup(() => useDateFormatter());
      const date = new Date(2025, 11, 3); // December 3, 2025
      expect(formatToIsoDateOnly(date)).toBe("2025-12-03");
    });

    it("handles December 31 correctly", () => {
      const { formatToIsoDateOnly } = withSetup(() => useDateFormatter());
      const date = new Date(2025, 11, 31);
      expect(formatToIsoDateOnly(date)).toBe("2025-12-31");
    });

    it("handles January 1 correctly", () => {
      const { formatToIsoDateOnly } = withSetup(() => useDateFormatter());
      const date = new Date(2025, 0, 1);
      expect(formatToIsoDateOnly(date)).toBe("2025-01-01");
    });
  });

  // -------------------------------------------------------------------------
  // formatToMediumDate
  // -------------------------------------------------------------------------
  describe("formatToMediumDate", () => {
    it("returns empty string for null", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      expect(formatToMediumDate(null)).toBe("");
    });

    it("returns empty string for empty string", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      expect(formatToMediumDate("")).toBe("");
    });

    it("returns empty string for an invalid date string", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      expect(formatToMediumDate("not-a-date")).toBe("");
    });

    it("formats a YYYY-MM-DD string to a medium date", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      const result = formatToMediumDate("2025-06-15");
      // Medium date format for en-US is "Jun 15, 2025"
      expect(result).toMatch(/Jun/i);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2025/);
    });

    it("formats a Date object to a medium date", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      const date = new Date(2025, 5, 15); // June 15, 2025
      const result = formatToMediumDate(date);
      expect(result).toMatch(/Jun/i);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2025/);
    });

    it("does not shift the date due to timezone when given a YYYY-MM-DD string", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      // This test guards against the UTC midnight timezone shift bug.
      // If "2025-01-01" were parsed as UTC, it could display as Dec 31 in negative-offset timezones.
      const result = formatToMediumDate("2025-01-01");
      expect(result).toMatch(/Jan/i);
      expect(result).toMatch(/1/);
      expect(result).toMatch(/2025/);
    });

    it("strips time component from a datetime string", () => {
      const { formatToMediumDate } = withSetup(() => useDateFormatter());
      const result = formatToMediumDate("2025-06-15T10:30:00");
      expect(result).toMatch(/Jun/i);
      expect(result).toMatch(/15/);
    });
  });

  // -------------------------------------------------------------------------
  // Round-trip: formatToIsoDateOnly → formatToMediumDate
  // -------------------------------------------------------------------------
  describe("round-trip", () => {
    it("formatToIsoDateOnly output can be read back by formatToMediumDate", () => {
      const { formatToIsoDateOnly, formatToMediumDate } = withSetup(() => useDateFormatter());
      const original = new Date(2025, 8, 20); // Sept 20, 2025
      const iso = formatToIsoDateOnly(original);
      const display = formatToMediumDate(iso);
      expect(display).toMatch(/Sep/i);
      expect(display).toMatch(/20/);
      expect(display).toMatch(/2025/);
    });
  });
});
