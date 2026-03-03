// tests/stores/NotificationStore.spec.ts
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useNotificationStore } from "@/stores/NotificationStore";

describe("NotificationStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("isVisible is false", () => {
      const store = useNotificationStore();
      expect(store.isVisible).toBe(false);
    });

    it("text is empty string", () => {
      const store = useNotificationStore();
      expect(store.text).toBe("");
    });

    it("color is 'success'", () => {
      const store = useNotificationStore();
      expect(store.color).toBe("success");
    });

    it("snackbarKey starts at 0", () => {
      const store = useNotificationStore();
      expect(store.snackbarKey).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // showMessage
  // -------------------------------------------------------------------------
  describe("showMessage", () => {
    it("sets text to the provided message", async () => {
      const store = useNotificationStore();
      await store.showMessage("Hello world");
      expect(store.text).toBe("Hello world");
    });

    it("sets isVisible to true", async () => {
      const store = useNotificationStore();
      await store.showMessage("Hello world");
      expect(store.isVisible).toBe(true);
    });

    it("defaults color to 'success' when no type is provided", async () => {
      const store = useNotificationStore();
      await store.showMessage("Hello world");
      expect(store.color).toBe("success");
    });

    it("sets color to 'error' when type is 'error'", async () => {
      const store = useNotificationStore();
      await store.showMessage("Oops", "error");
      expect(store.color).toBe("error");
    });

    it("sets color to 'warning' when type is 'warning'", async () => {
      const store = useNotificationStore();
      await store.showMessage("Watch out", "warning");
      expect(store.color).toBe("warning");
    });

    it("sets color to 'info' when type is 'info'", async () => {
      const store = useNotificationStore();
      await store.showMessage("FYI", "info");
      expect(store.color).toBe("info");
    });

    it("increments snackbarKey on each call", async () => {
      const store = useNotificationStore();
      await store.showMessage("First");
      expect(store.snackbarKey).toBe(1);
      await store.showMessage("Second");
      expect(store.snackbarKey).toBe(2);
    });

    it("updates text when called multiple times", async () => {
      const store = useNotificationStore();
      await store.showMessage("First message");
      await store.showMessage("Second message");
      expect(store.text).toBe("Second message");
    });

    it("updates color when called multiple times with different types", async () => {
      const store = useNotificationStore();
      await store.showMessage("First", "error");
      await store.showMessage("Second", "info");
      expect(store.color).toBe("info");
    });
  });
});
