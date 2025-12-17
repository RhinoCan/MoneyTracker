// __tests__/composables/useDateFormatter.spec.ts

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useDateFormatter } from '@/composables/useDateFormatter';
import { useDateFormatStore } from '@/stores/DateFormatStore';
import { createPinia, setActivePinia } from 'pinia';
import { format } from 'date-fns';

// --- MOCK THE DEPENDENCY (DateFormatStore) ---
// We will control the store's activeDateFormat property for testing.
let mockActiveDateFormatRef = ref('yyyy-MM-dd');

vi.mock('@/stores/DateFormatStore', () => {
    return {
        useDateFormatStore: vi.fn(() => ({
            // Mock the reactive value the composable is interested in
            get activeDateFormat() {
                return mockActiveDateFormatRef.value;
            },
        })),
    };
});
// ---------------------------------------------

describe('useDateFormatter', () => {

    // Define a stable date for consistent testing
    const TEST_DATE_STRING = '2025-05-15T10:30:00.000Z'; // May 15, 2025 (Thursday)
    const testDate = new Date(TEST_DATE_STRING);

    beforeEach(() => {
        // 1. Reset Pinia environment (required if we were not mocking)
        setActivePinia(createPinia());
        // 2. Reset the store mock's state for each test
        mockActiveDateFormatRef.value = 'yyyy-MM-dd';
        vi.clearAllMocks();
    });

    // --- TEST 1: Basic Formatting ---
    test('1. should format a Date object based on the default store format', () => {
        const { formatDate } = useDateFormatter();

        const expected = format(testDate, 'yyyy-MM-dd'); // '2025-05-15'
        expect(formatDate(testDate)).toBe(expected);
    });

    // --- TEST 2: Input Handling ---
    test('2. should handle various date input types (string, number) and null/empty', () => {
        const { formatDate } = useDateFormatter();
        const expected = format(testDate, 'yyyy-MM-dd');

        // Test Date object (already covered, for sanity)
        expect(formatDate(testDate)).toBe(expected);

        // Test date string
        expect(formatDate(TEST_DATE_STRING)).toBe(expected);

        // Test number (timestamp)
        const timestamp = testDate.getTime();
        expect(formatDate(timestamp)).toBe(expected);

        // Test null/empty input
        expect(formatDate(null as unknown as Date)).toBe('');
        expect(formatDate('')).toBe('');
    });

    // --- TEST 3: Reactivity (Crucial Test) ---
    test('3. should use the updated date format when the store mock changes', () => {
        // ARRANGE: Get the formatter
        const { formatDate } = useDateFormatter();

        // ACT 1: Use the default format
        const defaultFormatResult = formatDate(testDate);
        expect(defaultFormatResult).toBe('2025-05-15');

        // ACT 2: Simulate a change in the store's format (by changing the mock variable)
        // Change the mock to a more descriptive format (e.g., 'MMMM do, yyyy')
        mockActiveDateFormatRef.value = 'MMMM do, yyyy';

        // ACT 3: Format the same date again.
        // Because the composable uses a computed property on the mock, the function call should
        // pick up the new value (Note: Vitest runs synchronously, so we can test the change immediately).
        const newFormatResult = formatDate(testDate);

        const expected = format(testDate, 'MMMM do, yyyy'); // May 15th, 2025

        // ASSERT: The result MUST reflect the change in the mock store
        expect(newFormatResult).toBe(expected);
    });

    // --- TEST 4: Different format tokens ---
    test('4. should correctly apply various format tokens (date-fns)', () => {
        const { formatDate } = useDateFormatter();

        // ARRANGE 1: Test with day of the week
        mockActiveDateFormatRef.value = 'EEEE, MMM dd';
        let expected = format(testDate, mockActiveDateFormatRef.value); // 'Thursday, May 15'
        expect(formatDate(testDate)).toBe(expected);

        // ARRANGE 2: Test with time
        mockActiveDateFormatRef.value = 'hh:mm a';
        expected = format(testDate, mockActiveDateFormatRef.value); // '10:30 AM' (assuming UTC date used, adjust if necessary)
        expect(formatDate(testDate)).toBe(expected);
    });
});