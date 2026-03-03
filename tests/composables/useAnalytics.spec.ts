// tests/composables/useAnalytics.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAnalytics } from "@/composables/useAnalytics";

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: {
    capture: mockCapture,
  },
}));

describe("useAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("track", () => {
    it("calls posthog.capture with the event name", () => {
      const { track } = useAnalytics();
      track("transaction_created");
      expect(mockCapture).toHaveBeenCalledWith("transaction_created", undefined);
    });

    it("calls posthog.capture with event name and props", () => {
      const { track } = useAnalytics();
      track("transaction_created", { amount: 100, type: "Income" });
      expect(mockCapture).toHaveBeenCalledWith("transaction_created", {
        amount: 100,
        type: "Income",
      });
    });

    it("calls posthog.capture once per track call", () => {
      const { track } = useAnalytics();
      track("event_one");
      track("event_two");
      expect(mockCapture).toHaveBeenCalledTimes(2);
    });

    it("passes empty props object when provided", () => {
      const { track } = useAnalytics();
      track("some_event", {});
      expect(mockCapture).toHaveBeenCalledWith("some_event", {});
    });
  });
});
