import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDateFormatStore } from '@/stores/DateFormatStore';
import { DateFormatTemplate } from '@/types/CommonTypes';
import { appName } from '@/utils/SystemDefaults';

// Mock the SystemDefaults module
vi.mock('@/utils/SystemDefaults.ts', () => ({
  defaultCountry: 'US',
  appName: 'TestApp'
}));

// Mock the dateFormatMapper module
vi.mock('@/utils/dateFormatMapper.ts', () => ({
  determineDateFormatFromCountry: vi.fn((countryCode: string) => {
    if (countryCode === 'US') return DateFormatTemplate.USA;
    if (countryCode === 'DE') return DateFormatTemplate.EUR;
    return DateFormatTemplate.ISO;
  }),
}));

describe('DateFormatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with system-derived default when no localStorage exists', () => {
      const store = useDateFormatStore();

      // Should use defaultCountry (US) which maps to USA format
      expect(store.currentDateFormat).toBe(DateFormatTemplate.USA);
    });

    it('should initialize with saved format from localStorage', () => {
      const storageKey = `${appName}.DateFormat`;
      const savedData = { dateFormat: DateFormatTemplate.EUR };

      localStorage.setItem(storageKey, JSON.stringify(savedData));

      // Need to reset modules to re-run initialization
      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.EUR);
    });

    it('should fall back to ISO format when determineDateFormatFromCountry returns null', async () => {
      // Mock the function to return null
      const { determineDateFormatFromCountry } = await import('@/utils/dateFormatMapper.ts');
      vi.mocked(determineDateFormatFromCountry).mockReturnValue(null as any);

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);
    });

    it('should use correct storage key format', () => {
      const store = useDateFormatStore();
      store.setDateFormat(DateFormatTemplate.EUR);

      const storageKey = `${appName}.DateFormat`;
      const savedData = localStorage.getItem(storageKey);

      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual({ dateFormat: DateFormatTemplate.EUR });
    });

    it('should handle malformed localStorage data gracefully', () => {
      const storageKey = `${appName}.DateFormat`;
      localStorage.setItem(storageKey, 'invalid json {');

      vi.resetModules();

      // Should throw when trying to parse malformed JSON
      expect(() => {
        setActivePinia(createPinia());
        useDateFormatStore();
      }).toThrow();
    });
  });

  describe('setDateFormat', () => {
    it('should update activeDateFormat when setDateFormat is called', () => {
      const store = useDateFormatStore();

      store.setDateFormat(DateFormatTemplate.ISO);

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);
    });

    it('should persist format to localStorage when setDateFormat is called', () => {
      const store = useDateFormatStore();
      const storageKey = `${appName}.DateFormat`;

      store.setDateFormat(DateFormatTemplate.EUR);

      const savedData = localStorage.getItem(storageKey);
      expect(savedData).toBeTruthy();

      const parsed = JSON.parse(savedData!);
      expect(parsed).toEqual({ dateFormat: DateFormatTemplate.EUR });
    });

    it('should overwrite previous localStorage values', () => {
      const store = useDateFormatStore();
      const storageKey = `${appName}.DateFormat`;

      store.setDateFormat(DateFormatTemplate.USA);
      expect(JSON.parse(localStorage.getItem(storageKey)!).dateFormat).toBe(DateFormatTemplate.USA);

      store.setDateFormat(DateFormatTemplate.EUR);
      expect(JSON.parse(localStorage.getItem(storageKey)!).dateFormat).toBe(DateFormatTemplate.EUR);
    });

    it('should handle all DateFormatTemplate values', () => {
      const store = useDateFormatStore();

      const formats = [
        DateFormatTemplate.ISO,
        DateFormatTemplate.USA,
        DateFormatTemplate.EUR
      ];

      formats.forEach(format => {
        store.setDateFormat(format);
        expect(store.currentDateFormat).toBe(format);
      });
    });
  });

  describe('Multiple store instances', () => {
    it('should share state across multiple store instances', () => {
      const store1 = useDateFormatStore();
      store1.setDateFormat(DateFormatTemplate.EUR);

      const store2 = useDateFormatStore();

      expect(store2.currentDateFormat).toBe(DateFormatTemplate.EUR);
    });
  });

  describe('Persistence across sessions', () => {
    it('should restore format from localStorage in new session', () => {
      let store = useDateFormatStore();
      store.setDateFormat(DateFormatTemplate.ISO);

      // Simulate new session
      vi.resetModules();
      setActivePinia(createPinia());
      store = useDateFormatStore();

      expect(store.currentDateFormat).toBe(DateFormatTemplate.ISO);
    });

    it('should handle cleared localStorage gracefully', async () => {
      const store = useDateFormatStore();
      store.setDateFormat(DateFormatTemplate.EUR);

      localStorage.clear();

      vi.resetModules();
      setActivePinia(createPinia());

      // Need to re-import the mocked module after resetModules
      const { determineDateFormatFromCountry } = await import('@/utils/dateFormatMapper.ts');
      vi.mocked(determineDateFormatFromCountry).mockReturnValue(DateFormatTemplate.USA);

      const newStore = useDateFormatStore();

      // Should fall back to system default (USA)
      expect(newStore.currentDateFormat).toBe(DateFormatTemplate.USA);
    });
  });

  describe('Integration with determineDateFormatFromCountry', () => {
    it('should call determineDateFormatFromCountry with defaultCountry on initialization', async () => {
      const { determineDateFormatFromCountry } = await import('@/utils/dateFormatMapper.ts');

      vi.resetModules();
      setActivePinia(createPinia());
      useDateFormatStore();

      expect(determineDateFormatFromCountry).toHaveBeenCalledWith('US');
    });

    it('should not call determineDateFormatFromCountry when localStorage has saved value', async () => {
      const storageKey = `${appName}.DateFormat`;
      const savedData = { dateFormat: DateFormatTemplate.EUR };
      localStorage.setItem(storageKey, JSON.stringify(savedData));

      const { determineDateFormatFromCountry } = await import('@/utils/dateFormatMapper.ts');
      vi.mocked(determineDateFormatFromCountry).mockClear();

      vi.resetModules();
      setActivePinia(createPinia());
      useDateFormatStore();

      // Should use localStorage value instead of calling the mapper
      expect(determineDateFormatFromCountry).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle localStorage quota exceeded gracefully', () => {
      const store = useDateFormatStore();

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => {
        store.setDateFormat(DateFormatTemplate.ISO);
      }).toThrow();

      setItemSpy.mockRestore();
    });

    it('should handle invalid DateFormatTemplate values in localStorage', () => {
      const storageKey = `${appName}.DateFormat`;
      const invalidData = { dateFormat: 'invalid-format' };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      // TypeScript casting will accept it, so it will be stored as-is
      expect(store.currentDateFormat).toBe('invalid-format');
    });

    it('should handle missing dateFormat property in localStorage object', () => {
      const storageKey = `${appName}.DateFormat`;
      const invalidData = { wrongProperty: 'value' };
      localStorage.setItem(storageKey, JSON.stringify(invalidData));

      vi.resetModules();
      setActivePinia(createPinia());

      const store = useDateFormatStore();

      // Will be undefined, then cast to DateFormatTemplate
      expect(store.currentDateFormat).toBeUndefined();
    });
  });

  describe('State reactivity', () => {
    it('should trigger reactive updates when format changes', () => {
      const store = useDateFormatStore();
      const initialFormat = store.currentDateFormat;

      // Change to a different format
      const newFormat = initialFormat === DateFormatTemplate.ISO
        ? DateFormatTemplate.EUR
        : DateFormatTemplate.ISO;

      store.setDateFormat(newFormat);

      expect(store.currentDateFormat).not.toBe(initialFormat);
      expect(store.currentDateFormat).toBe(newFormat);
    });

    it('should allow setting the same format multiple times', () => {
      const store = useDateFormatStore();

      store.setDateFormat(DateFormatTemplate.USA);
      store.setDateFormat(DateFormatTemplate.USA);
      store.setDateFormat(DateFormatTemplate.USA);

      expect(store.currentDateFormat).toBe(DateFormatTemplate.USA);
    });
  });
});