import { isAfter, isBefore, startOfYear, startOfDay, endOfYesterday, parseISO } from 'date-fns';

/**
 * Provides a set of reusable validation rules for Vuetify form components.
 */
export function useAppValidationRules() {
    // ----------------------------------------------------
    // --- Date Checks (Calculated once per component load) ---
    // ----------------------------------------------------
    const today = new Date();
    // The start of the current calendar year (e.g., January 1st, 2025 00:00:00)
    const startOfCurrentYear = startOfYear(today);
    // The end of yesterday (e.g., December 13th, 2025 23:59:59)
    const yesterday = endOfYesterday();

    // ----------------------------------------------------
    // --- 1. Basic Rules ---
    // ----------------------------------------------------

    const required = (v: string | number | null | undefined) =>
        (!!v && v !== '') || 'This field is required.';

    // Rule for Transaction Type Radio Group
    const transactionTypeRequired = (v: string | null) =>
        (!!v) || "Transaction Type must be chosen";


    //Use start of TODAY for comparison. If date is after this, it's tomorrow or later.
    const startOfToday = startOfDay(today);


    // ----------------------------------------------------
    // --- 2. Date Rules ---
    // ----------------------------------------------------

    /**
     * Date validation rule: checks for no future dates and confines it to the current calendar year.
     * @param v The date string (expected to be an ISO string YYYY-MM-DD from the date picker).
     */
    const dateRangeRule = (v: string | null) => {

        if (!v) return 'Date is required.'; // Fail if empty

        // parseISO handles the YYYY-MM-DD format correctly.
        const parsedDate = parseISO(v);

        //Normalize the input date to start of its day for clean comparison
        const inputDateStart = startOfDay(parsedDate);

        // Check for Future Date (Must be today or earlier)
        // If the input date is after yesterday's end, it's a future date.
        if (isAfter(inputDateStart, startOfToday)) {
            return 'Transaction date cannot be in the future (tomorrow or later).';
        }

        // 2. Check for Previous Calendar Year
        // If the input date is before the start of the current calendar year
        if (isBefore(inputDateStart, startOfCurrentYear)) {
            return `Transaction date cannot be from a previous calendar year (${startOfCurrentYear.getFullYear()}).`;
        }

        return true; // Validation passed
    };

    // ----------------------------------------------------
    // --- 3. Amount Rules ---
    // ----------------------------------------------------

    /**
     * Amount validation rule: checks for valid currency format and positive value.
     * NOTE: This rule relies on the component's `handleBlur` or submit handler
     * to have correctly updated the underlying model to a parseable numeric value,
     * or set it to 0 if invalid.
     * @param v The display string from the text field (e.g., "$100.50").
     */
    const amountValidations = (v: string) => {
        // We use a basic scrubbing to get a number here, but your component's logic is the source of truth.
        // This is mainly to validate the string as a number > 0.
        const scrubbedValue = v.replace(/[^0-9.]/g, '');
        const parsedAmount = parseFloat(scrubbedValue);

        return (
            (!!parsedAmount && parsedAmount > 0) ||
            "Amount must be supplied and must be greater than zero"
        );
    };

    return {
        required: required,
        transactionTypeRequired,
        dateRangeRule,
        amountValidations,
    };
}