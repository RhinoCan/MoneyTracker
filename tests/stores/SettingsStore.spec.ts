// tests/stores/SettingsStore.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useSettingsStore } from "@/stores/SettingsStore";
import { useUserStore } from "@/stores/UserStore";

const mockSupabaseChain = {
  insert: vi.fn().mockResolvedValue({ error: null }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseChain),
  },
}));

vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
      t: (key: string) => key,
      te: () => false,
    },
  },
}));

describe("SettingsStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSupabaseChain.insert.mockResolvedValue({ error: null });
    mockSupabaseChain.upsert.mockResolvedValue({ error: null });
    mockSupabaseChain.delete.mockReturnThis();
    mockSupabaseChain.eq.mockReturnThis();
    mockSupabaseChain.maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  describe("initial state", () => {
    it("locale defaults to en-US", () => {
      const store = useSettingsStore();
      expect(store.locale).toBe("en-US");
    });

    it("currency defaults to USD", () => {
      const store = useSettingsStore();
      expect(store.currency).toBe("USD");
    });

    it("messageTimeoutSeconds defaults to -1", () => {
      const store = useSettingsStore();
      expect(store.messageTimeoutSeconds).toBe(-1);
    });

    it("isLoading defaults to false", () => {
      const store = useSettingsStore();
      expect(store.isLoading).toBe(false);
    });
  });

  describe("restoreDefaults", () => {
    it("resets locale to en-US", () => {
      const store = useSettingsStore();
      store.locale = "de-DE";
      store.restoreDefaults();
      expect(store.locale).toBe("en-US");
    });

    it("resets currency to USD", () => {
      const store = useSettingsStore();
      store.currency = "EUR";
      store.restoreDefaults();
      expect(store.currency).toBe("USD");
    });

    it("resets messageTimeoutSeconds to -1", () => {
      const store = useSettingsStore();
      store.messageTimeoutSeconds = 5;
      store.restoreDefaults();
      expect(store.messageTimeoutSeconds).toBe(-1);
    });
  });

  describe("loadSettings", () => {
    it("does nothing when userId is null", async () => {
      const store = useSettingsStore();
      await store.loadSettings();
      const { supabase } = await import("@/lib/supabase");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("hydrates state from database record when one exists", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      mockSupabaseChain.maybeSingle.mockResolvedValue({
        data: { locale_value: "fr-FR", currency_value: "EUR", timeout_value: 3 },
        error: null,
      });

      const store = useSettingsStore();
      await store.loadSettings();

      expect(store.locale).toBe("fr-FR");
      expect(store.currency).toBe("EUR");
      expect(store.messageTimeoutSeconds).toBe(3);
    });

    it("falls back to en-US, USD, and -1 for null fields in the database record", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      mockSupabaseChain.maybeSingle.mockResolvedValue({
        data: { locale_value: null, currency_value: null, timeout_value: null },
        error: null,
      });

      const store = useSettingsStore();
      await store.loadSettings();

      expect(store.locale).toBe("en-US");
      expect(store.currency).toBe("USD");
      expect(store.messageTimeoutSeconds).toBe(-1);
    });

    it("seeds a new record when no settings exist for the user", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "new-user-456" };

      mockSupabaseChain.maybeSingle.mockResolvedValue({ data: null, error: null });

      const store = useSettingsStore();
      await store.loadSettings();

      expect(mockSupabaseChain.insert).toHaveBeenCalled();
    });

    it("sets isLoading to false after completion", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      const store = useSettingsStore();
      await store.loadSettings();

      expect(store.isLoading).toBe(false);
    });

    it("sets isLoading to false even when an error occurs", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      mockSupabaseChain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      });

      const store = useSettingsStore();
      await expect(store.loadSettings()).rejects.toThrow();
      expect(store.isLoading).toBe(false);
    });
  });

  describe("saveToDb", () => {
    it("does nothing when userId is null", async () => {
      const store = useSettingsStore();
      await store.saveToDb();
      const { supabase } = await import("@/lib/supabase");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("calls upsert with the current settings state", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      const store = useSettingsStore();
      store.locale = "ja-JP";
      store.currency = "JPY";
      store.messageTimeoutSeconds = 5;

      await store.saveToDb();

      expect(mockSupabaseChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          locale_value: "ja-JP",
          currency_value: "JPY",
          timeout_value: 5,
        }),
        { onConflict: "user_id" }
      );
    });

    it("sets isLoading to false after completion", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      const store = useSettingsStore();
      await store.saveToDb();

      expect(store.isLoading).toBe(false);
    });

    it("throws and sets isLoading to false when upsert returns an error", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      mockSupabaseChain.upsert.mockResolvedValueOnce({
        error: { message: "upsert failed" },
      });

      const store = useSettingsStore();
      await expect(store.saveToDb()).rejects.toThrow();
      expect(store.isLoading).toBe(false);
    });
  });

  describe("clearFromDb", () => {
    it("does nothing when userId is null", async () => {
      const store = useSettingsStore();
      await store.clearFromDb();
      const { supabase } = await import("@/lib/supabase");
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("restores defaults after successful delete", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      const store = useSettingsStore();
      store.locale = "ko-KR";
      store.currency = "KRW";

      await store.clearFromDb();

      expect(store.locale).toBe("en-US");
      expect(store.currency).toBe("USD");
    });

    it("sets isLoading to false after completion", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      const store = useSettingsStore();
      await store.clearFromDb();

      expect(store.isLoading).toBe(false);
    });

    it("throws and sets isLoading to false when delete returns an error", async () => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };

      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: { message: "delete failed" },
      });

      const store = useSettingsStore();
      await expect(store.clearFromDb()).rejects.toThrow();
      expect(store.isLoading).toBe(false);
    });
  });

  describe("localeToCurrency export", () => {
    it("maps en-US to USD", async () => {
      const { localeToCurrency } = await import("@/stores/SettingsStore");
      expect(localeToCurrency["en-US"]).toBe("USD");
    });

    it("maps ja-JP to JPY", async () => {
      const { localeToCurrency } = await import("@/stores/SettingsStore");
      expect(localeToCurrency["ja-JP"]).toBe("JPY");
    });

    it("maps de-DE to EUR", async () => {
      const { localeToCurrency } = await import("@/stores/SettingsStore");
      expect(localeToCurrency["de-DE"]).toBe("EUR");
    });

    it("covers all 16 supported locales", async () => {
      const { localeToCurrency } = await import("@/stores/SettingsStore");
      expect(Object.keys(localeToCurrency)).toHaveLength(16);
    });
  });
});

