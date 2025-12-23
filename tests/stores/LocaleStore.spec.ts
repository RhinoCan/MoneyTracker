import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useLocaleStore } from "@/stores/LocaleStore";
import { appName } from "@/utils/SystemDefaults";

// Mock SystemDefaults
vi.mock('@/utils/SystemDefaults.ts', () => ({
  defaultLocale: 'en-US',
  appName: 'TestApp',
  LocaleOption: {}
}));

// Mock localeList
vi.mock('@/utils/localeList.ts', () => ({
  localeList: [
    { code: 'en-US', name: 'English (United States)' },
    { code: 'en-GB', name: 'English (United Kingdom)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'de-DE', name: 'German (Germany)' },
  ]
}));

type LocaleStoreInstance = ReturnType<typeof useLocaleStore>;

describe("LocaleStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default locale when no localStorage exists", () => {
      const store = useLocaleStore();

      expect(store.currentLocale).toBe('en-US');
      expect(store.isLocaleReady).toBe(false); // Not ready because no saved data
    });

    it("should initialize with saved locale from localStorage", () => {
      const storageKey = `${appName}.Locale`;
      const savedData = { locale: 'fr-FR' };

      localStorage.setItem(storageKey, JSON.stringify(savedData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useLocaleStore();

      expect(store.currentLocale).toBe('fr-FR');
      expect(store.isLocaleReady).toBe(true); // Ready because loaded from storage
    });

    it("should fall back to default locale when localStorage has malformed JSON", () => {
      const storageKey = `${appName}.Locale`;
      localStorage.setItem(storageKey, 'invalid json {');

      // Spy on console.error to verify error handling
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useLocaleStore();

      expect(store.currentLocale).toBe('en-US');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse Locale storage'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should use correct storage key format", () => {
      const store = useLocaleStore();
      store.updateLocale('ja-JP');

      const storageKey = `${appName}.Locale`;
      const savedData = localStorage.getItem(storageKey);

      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({ locale: 'ja-JP' });
    });

    it("should populate availableLocales from localeList", () => {
      const store = useLocaleStore();

      expect(store.availableLocales).toHaveLength(5);
      expect(store.availableLocales[0]).toEqual({
        code: 'en-US',
        label: 'English (United States)'
      });
    });
  });

  describe("updateLocale", () => {
    it("should update currentLocale when updateLocale is called", () => {
      const store = useLocaleStore();

      store.updateLocale('fr-FR');

      expect(store.currentLocale).toBe('fr-FR');
    });

    it("should set isLocaleReady to true when updateLocale is called", () => {
      const store = useLocaleStore();

      expect(store.isLocaleReady).toBe(false);

      store.updateLocale('ja-JP');

      expect(store.isLocaleReady).toBe(true);
    });

    it("should persist locale to localStorage when updateLocale is called", () => {
      const store = useLocaleStore();
      const storageKey = `${appName}.Locale`;

      store.updateLocale('de-DE');

      const savedData = localStorage.getItem(storageKey);
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed).toEqual({ locale: 'de-DE' });
    });

    it("should overwrite previous localStorage values", () => {
      const store = useLocaleStore();
      const storageKey = `${appName}.Locale`;

      store.updateLocale('en-GB');
      expect(JSON.parse(localStorage.getItem(storageKey)!).locale).toBe('en-GB');

      store.updateLocale('fr-FR');
      expect(JSON.parse(localStorage.getItem(storageKey)!).locale).toBe('fr-FR');
    });

    it("should handle locale codes not in availableLocales", () => {
      const store = useLocaleStore();

      // Custom locale not in the list
      store.updateLocale('es-ES');

      expect(store.currentLocale).toBe('es-ES');
      expect(store.isLocaleReady).toBe(true);
    });
  });

  describe("currentLocaleOption computed property", () => {
    it("should return the matching LocaleOption for current locale", () => {
      const store = useLocaleStore();

      store.updateLocale('en-GB');

      const option = store.currentLocaleOption;

      expect(option).toBeDefined();
      expect(option!.code).toBe('en-GB');
      expect(option!.label).toBe('English (United Kingdom)');
    });

    it("should return undefined for locale not in availableLocales", () => {
      const store = useLocaleStore();

      store.updateLocale('XX-XX');

      expect(store.currentLocaleOption).toBeUndefined();
    });

    it("should canonicalize locale codes (lowercase-UPPERCASE)", () => {
      const store = useLocaleStore();

      // Set with non-canonical format
      store.updateLocale('FR-fr');

      const option = store.currentLocaleOption;

      // Should find 'fr-FR' even though we set 'FR-fr'
      expect(option).toBeDefined();
      expect(option!.code).toBe('fr-FR');
    });

    it("should canonicalize simple language codes", () => {
      const store = useLocaleStore();

      // Add a simple code to test the single-part path
      store.availableLocales.push({ code: 'fr', label: 'French' });

      store.updateLocale('FR');

      const option = store.currentLocaleOption;

      expect(option).toBeDefined();
      expect(option!.code).toBe('fr');
    });

    it("should reactively update when locale changes", () => {
      const store = useLocaleStore();

      store.updateLocale('en-US');
      expect(store.currentLocaleOption!.code).toBe('en-US');

      store.updateLocale('ja-JP');
      expect(store.currentLocaleOption!.code).toBe('ja-JP');

      store.updateLocale('XX-XX');
      expect(store.currentLocaleOption).toBeUndefined();
    });
  });

  describe("Multiple store instances", () => {
    it("should share state across multiple store instances", () => {
      const store1 = useLocaleStore();
      store1.updateLocale('fr-FR');

      const store2 = useLocaleStore();

      expect(store2.currentLocale).toBe('fr-FR');
      expect(store2.isLocaleReady).toBe(true);
    });
  });

  describe("Persistence across sessions", () => {
    it("should restore locale from localStorage in new session", () => {
      let store = useLocaleStore();
      store.updateLocale('ja-JP');

      // Simulate new session
      vi.resetModules();
      setActivePinia(createPinia());
      store = useLocaleStore();

      expect(store.currentLocale).toBe('ja-JP');
      expect(store.isLocaleReady).toBe(true);
    });

    it("should handle cleared localStorage gracefully", () => {
      const store = useLocaleStore();
      store.updateLocale('de-DE');

      localStorage.clear();

      vi.resetModules();
      setActivePinia(createPinia());
      const newStore = useLocaleStore();

      // Should fall back to default
      expect(newStore.currentLocale).toBe('en-US');
      expect(newStore.isLocaleReady).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle localStorage quota exceeded gracefully", () => {
      const store = useLocaleStore();

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => {
        store.updateLocale('fr-FR');
      }).toThrow();

      setItemSpy.mockRestore();
    });

    it("should handle missing locale property in localStorage object", () => {
      const storageKey = `${appName}.Locale`;
      const invalidData = { wrongProperty: 'value' };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useLocaleStore();

      // Will be undefined, store should handle gracefully
      expect(store.currentLocale).toBeUndefined();
    });

    it("should handle empty string locale", () => {
      const store = useLocaleStore();

      store.updateLocale('');

      expect(store.currentLocale).toBe('');
      expect(store.isLocaleReady).toBe(true);
      expect(store.currentLocaleOption).toBeUndefined();
    });
  });

  describe("isLocaleReady flag behavior", () => {
    it("should be false on first load with no saved data", () => {
      const store = useLocaleStore();

      expect(store.isLocaleReady).toBe(false);
    });

    it("should be true after loading from localStorage", () => {
      const storageKey = `${appName}.Locale`;
      localStorage.setItem(storageKey, JSON.stringify({ locale: 'fr-FR' }));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useLocaleStore();

      expect(store.isLocaleReady).toBe(true);
    });

    it("should become true after first updateLocale call", () => {
      const store = useLocaleStore();

      expect(store.isLocaleReady).toBe(false);

      store.updateLocale('ja-JP');

      expect(store.isLocaleReady).toBe(true);
    });
  });

  describe("Canonicalization edge cases", () => {
    it("should handle locale codes with multiple hyphens", () => {
      const store = useLocaleStore();

      // Add a complex locale code
      store.availableLocales.push({ code: 'zh-Hans-CN', label: 'Chinese (Simplified, China)' });

      store.updateLocale('zh-hans-cn');

      const option = store.currentLocaleOption;

      // Canonicalization only handles first two parts
      // So 'zh-hans-cn' becomes 'zh-HANS-cn' which won't match 'zh-Hans-CN'
      // This documents current behavior
      expect(option).toBeUndefined();
    });

    it("should preserve original locale even if canonicalization fails to find match", () => {
      const store = useLocaleStore();

      store.updateLocale('zz-ZZ');

      expect(store.currentLocale).toBe('zz-ZZ');
      expect(store.currentLocaleOption).toBeUndefined();
    });
  });
});