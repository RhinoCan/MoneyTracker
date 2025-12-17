// __tests__/stores/DateFormatStore.fallback.spec.ts

import { describe, it, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { DateFormatTemplate } from '@/types/CommonTypes'; // Assuming correct import

// --- MOCK LOCAL STORAGE (REQUIRED) ---
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

// --- MOCK DEPENDENCIES TO FORCE FALLBACK (CRITICAL) ---
// These mocks ensure both persistedDateFormat (via clear) and defaultDateFormat (via mocks) fail.
vi.mock('@/utils/SystemDefaults.ts', () => ({
    // Fail 1: Default country is missing/falsy
    defaultCountry: '',
}));

vi.mock('@/utils/dateFormatMapper.ts', () => ({
    // Fail 2: The determination function returns null
    determineDateFormatFromCountry: vi.fn(() => null),
}));

// --- NOW IMPORT THE STORE ---
// The store's initialization (L17) happens immediately upon import.
import { useDateFormatStore } from '@/stores/DateFormatStore';

describe('DateFormatStore - Fallback Initialization (Fixes 75% Branch Coverage)', () => {

    // 1. Test the 'DateFormatTemplate.ISO' branch (The final OR check)
    it('1. should fall back to ISO format if local storage and system default are unavailable', () => {
        setActivePinia(createPinia());
        localStorageMock.clear();

        // Act: Create the store. It will use the failure mocks defined above.
        const fallbackStore = useDateFormatStore();

        // Assert: The store should have defaulted to the hardcoded ISO fallback.
        expect(fallbackStore.activeDateFormat).toBe(DateFormatTemplate.ISO);
        expect(fallbackStore.activeDateFormat).toBe('yyyy-MM-dd'); // Check the token
    });
});