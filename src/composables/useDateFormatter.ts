// src/composables/useDateFormatter.ts (The FINAL, simplified version)

import { computed } from 'vue';
import { format } from 'date-fns';
import { useDateFormatStore } from '@/stores/DateFormatStore';
// You still need to import DateFormatTemplate, but only for the store's type checking

/**
 * Provides a reactive function to format dates based on the user's
 * active preference stored in the DateFormatStore.
 * @returns A formatting function that takes a Date object or string and returns a formatted string.
 */
export function useDateFormatter() {
    // 1. Access the store
    const dateFormatStore = useDateFormatStore();

    // 2. The activeTemplate IS the final format string itself!
    const activeTemplate = computed(() => dateFormatStore.currentDateFormat);

    /**
     * Formats a date value using the currently selected user preference.
     * @param dateInput The date to be formatted (can be Date object, string, or number).
     * @returns The formatted date string.
     */
    const formatDate = (dateInput: Date | string | number): string => {
        if (!dateInput) {
            return ''; // Handle null/undefined input gracefully
        }

        const dateObject = new Date(dateInput);

        // USE THE STORE'S VALUE DIRECTLY, as it is already the token string.
        const formatString = activeTemplate.value; // <--- The Fix!

        return format(dateObject, formatString);
    };

    // Return the function that components will call
    return {
        formatDate,
    };
}