import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDateFormatter } from "@/composables/useDateFormatter";
import { useDateFormatStore } from "@/stores/DateFormatStore";
import { logWarning } from "@/utils/Logger";

// 1. Mock the store and logger
vi.mock("@/stores/DateFormatStore", () => ({
  useDateFormatStore: vi.fn(),
}));

vi.mock("@/utils/Logger", () => ({
  logWarning: vi.fn(),
}));

describe("useDateFormatter", () => {
  let mockStore: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default store state
    mockStore = {
      currentDateFormat: "yyyy-MM-dd",
    };
    (useDateFormatStore as any).mockReturnValue(mockStore);
  });

  it("should format a date correctly based on the store preference", () => {
    const { formatDate } = useDateFormatter();
    const testDate = new Date(2025, 11, 25); // Dec 25, 2025

    expect(formatDate(testDate)).toBe("2025-12-25");
  });

  it("should respond reactively to store changes", () => {
    const { formatDate } = useDateFormatter();
    const testDate = new Date(2025, 11, 25);

    // Change the template in the mock
    mockStore.currentDateFormat = "MM/dd/yyyy";

    expect(formatDate(testDate)).toBe("12/25/2025");
  });

  it("should return an empty string if input is falsy (Line 29)", () => {
    const { formatDate } = useDateFormatter();

    expect(formatDate("")).toBe("");
    expect(formatDate(null as any)).toBe("");
    expect(formatDate(undefined as any)).toBe("");
  });

  it("should log a warning for an invalid date but still try to format it (Line 35)", () => {
    const { formatDate } = useDateFormatter();
    const invalidInput = "not-a-date";

    // date-fns format() will throw an error if the date is invalid,
    // but the code reaches the logWarning first.
    // To strictly cover the code as written:
    try {
      formatDate(invalidInput);
    } catch (e) {
      // We expect an error from date-fns, but we want to check our logger
    }

    expect(logWarning).toHaveBeenCalledWith(
      "Input value to formatDate() is not a valid date",
      expect.objectContaining({ data: invalidInput })
    );
  });
});
