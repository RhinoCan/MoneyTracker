import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
import { nextTick } from 'vue';
import { TransactionTypeValues } from '@/types/Transaction';

// IMPORTANT: Do not statically import useTransactionFormFields here.
// It is imported dynamically in beforeEach to resolve the loading conflict.

// ------------------------------------
// --- MOCK DEPENDENCY DECLARATIONS ---
// ------------------------------------

// 1. Mock useCurrencyFormatter
const mockDisplayMoney = vi.fn();

// 2. Mock useDateFormatter
const mockFormatDate = vi.fn();

// 3. Mock useAppValidationRules
const mockRequired = vi.fn(() => true);
const mockDateRangeRule = vi.fn(() => true);
const mockAmountValidations = vi.fn(() => true);

// 4. Mock currencyParser (DECLARE only, implementation is in beforeEach)
const mockParseCurrency = vi.fn();

// -----------------------------
// --- VI.MOCK FACTORY CALLS (Only for non-problematic mocks) ---
// -----------------------------

vi.mock('@/composables/useCurrencyFormatter', () => ({
    useCurrencyFormatter: () => ({ displayMoney: mockDisplayMoney }),
}));

vi.mock('@/composables/useDateFormatter', () => ({
    useDateFormatter: () => ({ formatDate: mockFormatDate }),
}));

vi.mock('@/composables/useAppValidationRules', () => ({
    useAppValidationRules: () => ({
        required: mockRequired,
        dateRangeRule: mockDateRangeRule,
        amountValidations: mockAmountValidations,
    }),
}));

vi.mock('vue', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue')>();
    return {
        ...actual,
        nextTick: vi.fn(async (cb) => {
            await actual.nextTick();
            if (cb) cb();
        }),
    };
});

// -----------------------------
// --- SETUP AND TEARDOWN ---
// -----------------------------

let formFields: any;

beforeEach(async () => {
    // 1. Set implementations
    mockDisplayMoney.mockImplementation((amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return '';
        return `$${(amount || 0).toFixed(2)}`;
    });

    mockFormatDate.mockImplementation((date: Date) => date.toISOString().split('T')[0]);

    // Set implementation for the previously problematic mock
    mockParseCurrency.mockImplementation((input: string) => {
        const cleaned = input.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        if (isNaN(num)) return null;
        return num;
    });

    // 2. CRITICAL FIX: Use vi.doMock to load the currencyParser mock
    await vi.doMock('@/utils/currencyParser', () => ({
        parseCurrency: mockParseCurrency,
    }));

    // 3. Clear all calls before test execution
    vi.clearAllMocks();

    // 4. Dynamically import the module under test *inside* beforeEach.
    const { useTransactionFormFields: loadedUseTransactionFormFields } = await import(
        '@/composables/useTransactionFormFields'
    );

    // Instantiate the composable
    formFields = loadedUseTransactionFormFields();

    // 5. Ensure form is clean
    formFields.resetForm();
});

// -----------------------------
// --- TEST SUITE ---
// -----------------------------

describe('useTransactionFormFields', () => {

    test('1. should initialize with default values and expose core functions', () => {
        expect(formFields.transaction.value.amount).toBe(0);
        expect(formFields.transaction.value.transactionType).toBe(TransactionTypeValues.Expense);
        expect(formFields.formattedAmount.value).toBe('$0.00');
        expect(typeof formFields.resetForm).toBe('function');
    });

    test('2. should correctly format amount and date via computed properties', () => {
        // Arrange
        formFields.transaction.value.amount = 1234.56;
        formFields.transaction.value.date = new Date('2025-10-20T10:00:00.000Z');

        // Assert: Computed values updated
        expect(formFields.formattedAmount.value).toBe('$1234.56');
        expect(formFields.formattedDate.value).toBe('2025-10-20');
        expect(mockDisplayMoney).toHaveBeenCalledWith(1234.56);
        expect(mockFormatDate).toHaveBeenCalledTimes(1);
    });

    // 3. Covers colorClass: money-plus branch
    test('3. should return "money-plus" when type is Income and not focused', () => {
        formFields.transaction.value.transactionType = TransactionTypeValues.Income;
        formFields.isFocused.value = false;
        expect(formFields.colorClass.value).toBe('money-plus');
    });

    // 4. Covers colorClass: money-minus branch
    test('4. should return "money-minus" when type is Expense and not focused', () => {
        formFields.transaction.value.transactionType = TransactionTypeValues.Expense;
        formFields.isFocused.value = false;
        expect(formFields.colorClass.value).toBe('money-minus');
    });

    // 5. Covers handleFocus 'else' block (where amount is null/undefined)
    test('5. handleFocus should clear displayAmount if underlying amount is null', () => {
        (formFields.transaction.value.amount as any) = null;
        formFields.displayAmount.value = "100.00";

        formFields.handleFocus();

        expect(formFields.displayAmount.value).toBe('');
    });

    // 6. Covers handleBlur 'else' block (parsed amount is null or <= 0)
    test('6. handleBlur should reset amount to 0 if parsed amount is null (e.g., empty input)', () => {
        formFields.displayAmount.value = "";
        formFields.transaction.value.amount = 100;

        formFields.handleBlur();

        expect(formFields.transaction.value.amount).toBe(0);
        expect(formFields.displayAmount.value).toBe('$0.00');
        expect(mockParseCurrency).toHaveBeenCalledWith("");
    });

    // 7. Covers handleBlur 'if' block (Parsed amount > 0)
    test('7. handleBlur should update amount and re-format displayAmount for valid input', () => {
        formFields.displayAmount.value = "99.95";
        formFields.transaction.value.amount = 100;

        formFields.handleBlur();

        expect(formFields.transaction.value.amount).toBe(99.95);
        expect(formFields.displayAmount.value).toBe('$99.95');
        expect(mockParseCurrency).toHaveBeenCalledWith("99.95");
    });

    // 8. Covers closeDatePicker function execution
    test('8. closeDatePicker should set dateMenu to false on next tick', async () => {
        formFields.dateMenu.value = true;

        formFields.closeDatePicker();

        expect(formFields.dateMenu.value).toBe(true);
        expect(nextTick).toHaveBeenCalled();

        await (nextTick as Mock).mock.results[0].value;

        expect(formFields.dateMenu.value).toBe(false);
    });

    // 9. COVERS: colorClass 'if' block (money-neutral) and formattedAmount 'if' block (raw string)
    test('9. should show neutral color and raw amount when focused', () => {
        // Arrange: Set a value and manually set display amount to raw string
        formFields.transaction.value.amount = 50.00;
        formFields.displayAmount.value = "50";
        formFields.isFocused.value = true;

        // Assert: Checks the 'if' block in colorClass
        expect(formFields.colorClass.value).toBe('money-neutral');

        // Assert: Checks the 'if' block in formattedAmount
        expect(formFields.formattedAmount.value).toBe('50');
    });

    // 10. COVERS: handleFocus 'if' block (set displayAmount to raw string)
    test('10. handleFocus should set displayAmount to raw string if amount is numeric', () => {
        // Arrange: Start with a numeric amount and clean display field
        formFields.transaction.value.amount = 123.45;
        formFields.displayAmount.value = "$123.45";

        // Act
        formFields.handleFocus();

        // Assert
        expect(formFields.isFocused.value).toBe(true);
        expect(formFields.displayAmount.value).toBe('123.45');
    });


    // 11. Test the form reset functionality (was test 9)
    test('11. resetForm should return all values to default', () => {
        // Arrange: Change values
        formFields.transaction.value.amount = 500;
        formFields.transaction.value.transactionType = TransactionTypeValues.Income;
        formFields.transaction.value.description = "Test";
        formFields.displayAmount.value = "$500.00";

        // Act
        formFields.resetForm();

        // Assert
        expect(formFields.transaction.value.amount).toBe(0);
        expect(formFields.transaction.value.transactionType).toBe(TransactionTypeValues.Expense);
        expect(formFields.transaction.value.description).toBe("");
        expect(formFields.displayAmount.value).toBe("");

        const savedDate = new Date(formFields.transaction.value.date);
        const diff = new Date().getTime() - savedDate.getTime();
        expect(diff).toBeLessThan(1000);
    });
});