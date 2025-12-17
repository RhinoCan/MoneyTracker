// __tests__/stores/DateFormatStore.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDateFormatStore } from '@/stores/DateFormatStore';
import { DateFormatTemplate } from '@/types/CommonTypes';

// --- MOCK LOCAL STORAGE IMPLEMENTATION ---
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// --- DEFAULT MOCKS for the 'defaultDateFormat' success path ---
// These mocks ensure the system default lookup succeeds (Test 2).
vi.mock('@/utils/SystemDefaults.ts', () => ({
    defaultCountry: 'US',
}));

vi.mock('@/utils/dateFormatMapper.ts', () => ({
    determineDateFormatFromCountry: vi.fn((countryCode: string) => {
        // Mock success: US returns the USA format
        return countryCode === 'US' ? DateFormatTemplate.USA : DateFormatTemplate.ISO;
    }),
}));
// ------------------------------------------------------------------

describe('DateFormatStore - Success Paths', () => {

    let store: ReturnType<typeof useDateFormatStore>;

    beforeEach(() => {
        // Reset Pinia state and clear mock storage
        setActivePinia(createPinia());
        localStorageMock.clear();
        vi.clearAllMocks();

        // Initialize the store using the default success mocks
        store = useDateFormatStore();
    });

// 1. Test the 'persistedDateFormat' branch (First OR check)
    it('1. should initialize with the persisted format when available', () => {
        const persistedFormat = DateFormatTemplate.EUR; // 'dd.MM.yyyy'

        // Arrange: Set a preference in localStorage
        localStorageMock.setItem('dateFormatPreference', persistedFormat);

        // --- CRITICAL FIX: Reset module cache ---
        // This forces the store's top-level initialization code (where persistence is read) to re-run.
        vi.resetModules();
        setActivePinia(createPinia()); // Reset Pinia state again

        // Act: Use the globally imported useDateFormatStore function.
        // It will now return a fresh store instance that has read the persistence.
        const persistedStore = useDateFormatStore();

        // Assert: State should match the persisted value (EUR)
        expect(persistedStore.activeDateFormat).toBe(persistedFormat);
        expect(persistedStore.activeDateFormat).toBe('dd.MM.yyyy');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('dateFormatPreference');
    });

    // 2. Test the 'defaultDateFormat' branch (Second OR check)
    it('2. should initialize with the system-derived default format when no persistence exists', () => {
        // Arrange: localStorage is empty (from beforeEach), defaultCountry='US', maps to USA ('MM/dd/yyyy').

        // Assert: State should match the system default (USA)
        expect(store.activeDateFormat).toBe(DateFormatTemplate.USA);
        expect(store.activeDateFormat).toBe('MM/dd/yyyy');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('dateFormatPreference');
    });

    // 3. Test the 'setDateFormat' action (The core mutation)
    it('3. should update activeDateFormat and persist the change', () => {
        const newFormat = DateFormatTemplate.ISO; // 'yyyy-MM-dd'

        store.setDateFormat(newFormat);

        // 1. Check reactive state update
        expect(store.activeDateFormat).toBe(newFormat);
        expect(store.activeDateFormat).toBe('yyyy-MM-dd');

        // 2. Check persistence update
        expect(localStorageMock.setItem).toHaveBeenCalledWith('dateFormatPreference', newFormat);
    });
});