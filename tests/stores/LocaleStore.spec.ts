import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useLocaleStore } from "@/stores/LocaleStore";
import { appName, defaultLocale } from "@/utils/SystemDefaults";

const { mockLogException } = vi.hoisted(() => ({ mockLogException: vi.fn() }));
vi.mock("@/utils/Logger", () => ({ logException: mockLogException }));

vi.mock("@/utils/SystemDefaults.ts", () => ({
  defaultLocale: "en-US",
  appName: "TestApp",
}));

vi.mock("@/utils/localeList.ts", () => ({
  localeList: [
    { code: "en-US", name: "English (US)" },
    { code: "fr-FR", name: "French" },
    { code: "ja-JP", name: "Japanese" },
  ],
}));

describe("LocaleStore", () => {
  const storageKey = `TestApp.Locale`;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initialization & Hydration", () => {
    it("Init > when storage is empty or malformed, then determine a default locale", () => {
      localStorage.setItem(storageKey, "invalid {");
      const store = useLocaleStore();
      expect(store.currentLocale).toBe(defaultLocale);
      expect(mockLogException).toHaveBeenCalled();
    });

    it("Init > when localStorage is valid, the store should hydrate correctly", () => {
      localStorage.setItem(storageKey, JSON.stringify({ locale: "fr-FR" }));
      const store = useLocaleStore();
      expect(store.currentLocale).toBe("fr-FR");
    });
  });

  describe("updateLocale (The Gatekeeper)", () => {
    it("Update > when valid locales are provided as the new locales, the state and localStorage should be correctly updated", () => {
      const store = useLocaleStore();
      store.updateLocale("ja-JP");
      expect(store.currentLocale).toBe("ja-JP");
      expect(JSON.parse(localStorage.getItem(storageKey)!).locale).toBe(
        "ja-JP"
      );
    });

    it("Update > when cases of locales are incorrect, then they should be canonicalized correctly (e.g., fr-fr -> fr-FR)", () => {
      const store = useLocaleStore();
      store.updateLocale("fr-fr");
      expect(store.currentLocale).toBe("fr-FR");
    });

    it("Update > when invalid or unknown locales are provided as the new locales, then they should fallback to default locale", () => {
      const store = useLocaleStore();
      const cases = ["XX-XX", "", "random-string"];

      cases.forEach((val) => {
        store.updateLocale(val);
        expect(store.currentLocale).toBe(defaultLocale);
      });
    });

    it("Update > when a complex locale is provided as the new locale, then it should fallback to default locale (e.g. zh-hans-cn -> en-US fallback)", () => {
      const store = useLocaleStore();
      store.updateLocale("zh-hans-cn");
      // Per your logic, this doesn't match our 3-part mock, so it hits default
      expect(store.currentLocale).toBe(defaultLocale);
    });

    it("Update > when an uppercase locale is provided as the new locale, it should be lowercased (e.g. EN -> en)", () => {
      const store = useLocaleStore();
      store.availableLocales.push({ code: "en", name: "English Generic" });
      store.updateLocale("EN");
      expect(store.currentLocale).toBe("en");
    });
  });

  describe("Error Handling", () => {
    it("Error > when localStorage quota is exceeded, then an exception should be logged", () => {
      const store = useLocaleStore();
      const spy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new DOMException("QuotaExceededError");
        });

      store.updateLocale("fr-FR");
      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(DOMException),
        expect.objectContaining({ action: "Update Locale" })
      );
      spy.mockRestore();
    });
  });
});
