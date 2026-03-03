vi.unmock("@/lib/Logger");

import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";

// --- MOCKS ---
const { mockWithScope, mockCaptureException, mockCaptureMessage, mockPosthogCapture } =
  vi.hoisted(() => ({
    mockWithScope: vi.fn((cb: (scope: any) => void) =>
      cb({ setTag: vi.fn(), setLevel: vi.fn(), setExtras: vi.fn() })
    ),
    mockCaptureException: vi.fn(),
    mockCaptureMessage: vi.fn(),
    mockPosthogCapture: vi.fn(),
  }));

vi.mock("@sentry/vue", () => ({
  withScope: mockWithScope,
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
}));

vi.mock("posthog-js", () => ({
  default: {
    capture: mockPosthogCapture,
  },
}));

vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      te: vi.fn((key: string) => key === "known.key"),
      t: vi.fn((key: string) => `translated:${key}`),
    },
  },
}));

import {
  logException,
  logValidation,
  logSuccess,
  logWarning,
  logInfo,
} from "@/lib/Logger";
import { useNotificationStore } from "@/stores/NotificationStore";

describe("Logger.ts", () => {
  const meta = { module: "TestModule", action: "testAction" };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Restore withScope behaviour after clearAllMocks resets it
    mockWithScope.mockImplementation((cb: (scope: any) => void) =>
      cb({ setTag: vi.fn(), setLevel: vi.fn(), setExtras: vi.fn() })
    );
  });

  // --- translateIfPossible (tested indirectly) ---
  describe("translateIfPossible", () => {
    it("returns translation when key exists in i18n", async () => {
      const store = useNotificationStore();
      logSuccess("known.key", meta);
      await vi.waitFor(() => expect(store.text).toBe("translated:known.key"));
    });

    it("returns original string when key does not exist in i18n", async () => {
      const store = useNotificationStore();
      logSuccess("Just a plain message", meta);
      await vi.waitFor(() => expect(store.text).toBe("Just a plain message"));
    });
  });

  // --- logException ---
  describe("logException", () => {
    it("calls Sentry withScope", () => {
      logException(new Error("boom"), meta);
      expect(mockWithScope).toHaveBeenCalled();
    });

    it("calls PostHog capture with 'exception'", () => {
      logException(new Error("boom"), meta);
      expect(mockPosthogCapture).toHaveBeenCalledWith("exception", expect.any(Object));
    });

    it("shows error snackbar with slug translation when slug is provided", async () => {
      const store = useNotificationStore();
      logException(new Error("boom"), { ...meta, slug: "known.key" });
      await vi.waitFor(() => expect(store.text).toBe("translated:known.key"));
    });

    it("shows error snackbar with error message when no slug", async () => {
      const store = useNotificationStore();
      logException(new Error("raw error message"), meta);
      await vi.waitFor(() => expect(store.text).toBe("raw error message"));
    });

    it("shows error snackbar with stringified value for non-Error", async () => {
      const store = useNotificationStore();
      logException("something went wrong", meta);
      await vi.waitFor(() => expect(store.text).toBe("something went wrong"));
    });

    it("sets snackbar color to error", async () => {
      const store = useNotificationStore();
      logException(new Error("boom"), meta);
      await vi.waitFor(() => expect(store.color).toBe("error"));
    });
  });

  // --- logValidation ---
  describe("logValidation", () => {
    it("calls PostHog capture with 'validation'", () => {
      logValidation("known.key", meta);
      expect(mockPosthogCapture).toHaveBeenCalledWith("validation", expect.any(Object));
    });

    it("shows warning snackbar with translated message", async () => {
      const store = useNotificationStore();
      logValidation("known.key", meta);
      await vi.waitFor(() => expect(store.text).toBe("translated:known.key"));
    });

    it("sets snackbar color to warning", async () => {
      const store = useNotificationStore();
      logValidation("known.key", meta);
      await vi.waitFor(() => expect(store.color).toBe("warning"));
    });

    it("does not call Sentry", () => {
      logValidation("known.key", meta);
      expect(mockWithScope).not.toHaveBeenCalled();
    });
  });

  // --- logSuccess ---
  describe("logSuccess", () => {
    it("calls PostHog capture with 'success'", () => {
      logSuccess("known.key", meta);
      expect(mockPosthogCapture).toHaveBeenCalledWith("success", expect.any(Object));
    });

    it("shows success snackbar with translated message", async () => {
      const store = useNotificationStore();
      logSuccess("known.key", meta);
      await vi.waitFor(() => expect(store.text).toBe("translated:known.key"));
    });

    it("sets snackbar color to success", async () => {
      const store = useNotificationStore();
      logSuccess("known.key", meta);
      await vi.waitFor(() => expect(store.color).toBe("success"));
    });

    it("does not call Sentry", () => {
      logSuccess("known.key", meta);
      expect(mockWithScope).not.toHaveBeenCalled();
    });
  });

  // --- logWarning ---
  describe("logWarning", () => {
    it("calls Sentry withScope", () => {
      logWarning("something degraded", meta);
      expect(mockWithScope).toHaveBeenCalled();
    });

    it("calls PostHog capture with 'warning'", () => {
      logWarning("something degraded", meta);
      expect(mockPosthogCapture).toHaveBeenCalledWith("warning", expect.any(Object));
    });

    it("does not show a snackbar", () => {
      const store = useNotificationStore();
      logWarning("something degraded", meta);
      expect(store.isVisible).toBe(false);
    });
  });

  // --- logInfo ---
  describe("logInfo", () => {
    it("calls PostHog capture with 'info'", () => {
      logInfo("something happened", meta);
      expect(mockPosthogCapture).toHaveBeenCalledWith("info", expect.any(Object));
    });

    it("does not call Sentry", () => {
      logInfo("something happened", meta);
      expect(mockWithScope).not.toHaveBeenCalled();
    });

    it("does not show a snackbar", () => {
      const store = useNotificationStore();
      logInfo("something happened", meta);
      expect(store.isVisible).toBe(false);
    });
  });
});