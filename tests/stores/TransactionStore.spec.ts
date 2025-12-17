// __tests__/stores/TransactionStore.spec.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransactionStore } from '@/stores/TransactionStore.ts';
import { Transaction } from '@/types/Transaction.ts';
// Assuming useToast is mocked globally or handled by your test setup.

// Get the return type of the store for type safety
type TransactionStoreInstance = ReturnType<typeof useTransactionStore>;

// --- MOCK SETUP: LocalStorage ---
const mockLocalStorage = (() => {
    let store: { [key: string]: string } = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        clear: () => { store = {}; },
        removeItem: (key: string) => { delete store[key]; }
    };
})();
// Replace global localStorage in tests
global.localStorage = mockLocalStorage as any;

// --- MOCK DATA (UPDATED: Using 'description' and 'date') ---
const MOCK_INCOME: Transaction = {
    id: 1,
    description: 'Salary Deposit', // Changed from 'text' to 'description'
    date: '2025-01-01',           // Added date
    amount: 5000,
    transactionType: 'Income',
};
const MOCK_EXPENSE: Transaction = {
    id: 2,
    description: 'Monthly Rent',   // Changed from 'text' to 'description'
    date: '2025-01-05',           // Added date
    amount: 1500,
    transactionType: 'Expense',
};
const MOCK_TRANSACTIONS: Transaction[] = [MOCK_INCOME, MOCK_EXPENSE];


// ----------------------------------------------------------------------------------
// DESCRIBE BLOCK 1: Initialization Logic (COVERS L23-L28)
// ----------------------------------------------------------------------------------

describe('TransactionStore Initialization', () => {
    let store: TransactionStoreInstance;

    beforeEach(() => {
        // Clear Pinia state and localStorage before each test
        setActivePinia(createPinia());
        localStorage.clear();
    });

    // COVERS L23-24 (Try block of JSON.parse)
    it('1A. should successfully load transactions from local storage', () => {
        // Arrange: Set valid JSON data in the mocked localStorage
        localStorage.setItem('transactions', JSON.stringify([MOCK_INCOME]));

        // Act: Initialize the store (this triggers the loading logic)
        store = useTransactionStore();

        // Assert: Check if the transactions array contains the loaded data
        expect(store.transactions.length).toBe(1);
        expect(store.transactions[0].description).toBe('Salary Deposit');
    });

    // COVERS L25-27 (Catch block of JSON.parse)
    it('1B. should handle failed local storage parsing and log an error', () => {
        // Arrange: Mock console.error (to suppress output) and set invalid data
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('transactions', 'This is definitely not JSON');

        // Act: Initialize the store (this triggers the try...catch logic)
        store = useTransactionStore();

        // Assert 1: The store state should be empty, as the load failed
        expect(store.transactions.length).toBe(0);

        // Assert 2: The console.error line (L26) must have been called
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Failed to parse transactions from local storage:",
            expect.any(SyntaxError) // Expects a parsing error object
        );

        // Cleanup
        consoleErrorSpy.mockRestore();
    });
});


// ----------------------------------------------------------------------------------
// DESCRIBE BLOCK 2: Core Getters and Actions
// ----------------------------------------------------------------------------------

describe('TransactionStore Core', () => {
    let store: TransactionStoreInstance;
    let saveToLocalStorageSpy: any;

    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();

        // Initialize store with mock data for subsequent tests
        localStorage.setItem('transactions', JSON.stringify(MOCK_TRANSACTIONS));
        store = useTransactionStore();

        // Spy on localStorage.setItem to verify persistence (saveToLocalStorage function)
        saveToLocalStorageSpy = vi.spyOn(localStorage, 'setItem');
    });

    afterEach(() => {
        // Restore the spy to prevent test leakage
        saveToLocalStorageSpy.mockRestore();
    });

    it('2. should initialize with mock data', () => {
        expect(store.transactions.length).toBe(2);
    });

    // GETTERS
    it('3. getIncome should correctly calculate total income', () => {
        expect(store.getIncome).toBe(5000.00);
    });

    it('4. getExpense should correctly calculate total expense', () => {
        expect(store.getExpense).toBe(1500.00);
    });

    it('5. getBalance should calculate the correct balance', () => {
        expect(store.getBalance).toBe(3500.00);
    });

    it('6. getNewId should return 1 for an empty store', () => {
        store.transactions = []; // Empty the array
        expect(store.getNewId).toBe(1);
    });

    it('7. getNewId should return the highest existing ID + 1', () => {
        // Highest ID in MOCK_TRANSACTIONS is 2
        expect(store.getNewId).toBe(3);
    });

    // ACTIONS
    it('8. addTransaction should add a transaction and save to local storage', () => {
        const newTransaction: Transaction = {
            id: 3,
            description: 'Bonus',          // Changed to 'description'
            date: '2025-01-10',            // Added date
            amount: 500,
            transactionType: 'Income',
        };

        store.addTransaction(newTransaction);

        expect(store.transactions.length).toBe(3);
        expect(store.getBalance).toBe(4000.00);
        expect(saveToLocalStorageSpy).toHaveBeenCalled();
    });

    it('9. updateTransaction should update an existing transaction and save', () => {
        const updatedTransaction: Transaction = {
            ...MOCK_EXPENSE,
            amount: 1600.00, // Change from 1500
            description: 'Rent (Adjusted)', // Changed to 'description'
            date: '2025-01-05' // Use existing date
        };

        // COVERS L124 (Success path of update)
        store.updateTransaction(updatedTransaction);

        const updatedItem = store.transactions.find(t => t.id === updatedTransaction.id);
        expect(updatedItem!.amount).toBe(1600.00);
        expect(updatedItem!.description).toBe('Rent (Adjusted)');
        expect(store.getBalance).toBe(3400.00); // 5000 - 1600 = 3400
        expect(saveToLocalStorageSpy).toHaveBeenCalled();
    });

    it('10. updateTransaction should handle non-existent transaction (error path) and save', () => {
        const nonExistent: Transaction = {
            id: 999,
            description: 'Missing Transaction', // Changed to 'description'
            date: '2025-01-01',                // Added date
            amount: 10,
            transactionType: 'Expense',
        };

        // COVERS L126-127 (Else block of update)
        store.updateTransaction(nonExistent);

        expect(store.transactions.length).toBe(2); // No change
        expect(saveToLocalStorageSpy).toHaveBeenCalled();
    });

    it('11. deleteTransaction should remove a transaction and save to local storage', () => {
        const idToDelete = MOCK_INCOME.id;

        store.deleteTransaction(idToDelete);

        expect(store.transactions.length).toBe(1);
        expect(store.transactions.every(t => t.id !== idToDelete)).toBe(true);
        expect(store.getBalance).toBe(-1500.00); // Only the expense remains
        expect(saveToLocalStorageSpy).toHaveBeenCalled();
    });

    it('12. deleteTransaction should handle non-existent transaction (error path)', () => {
        // COVERS L147-148 (If block of delete, exit early)
        const idToDelete = 999;

        store.deleteTransaction(idToDelete);

        expect(store.transactions.length).toBe(2); // No change
        // saveToLocalStorage is not called because the function returns early after the toast.error
        expect(saveToLocalStorageSpy).not.toHaveBeenCalled();
    });
});


// ----------------------------------------------------------------------------------
// DESCRIBE BLOCK 3: Edge Cases for 100% Coverage
// ----------------------------------------------------------------------------------

describe('TransactionStore Edge Cases', () => {
    let store: TransactionStoreInstance;

    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        store = useTransactionStore();
    });

    // COVERS LINE 80: The branch where prev is falsy in the reduce ternary
    it('13. getNewId should handle edge case with transaction having id of 0', () => {
        // Create a transaction with id 0 (falsy value)
        const transactionWithZeroId: Transaction = {
            id: 0,
            description: 'Transaction with zero ID',
            date: '2025-01-01',
            amount: 100,
            transactionType: 'Income',
        };

        const transactionWithHigherId: Transaction = {
            id: 5,
            description: 'Transaction with higher ID',
            date: '2025-01-02',
            amount: 200,
            transactionType: 'Income',
        };

        // Add both transactions
        store.transactions = [transactionWithZeroId, transactionWithHigherId];

        // The reduce should handle the falsy prev (id: 0) and still return correct max
        // This covers the (prev && prev.id > current.id) ternary where prev is falsy
        expect(store.getNewId).toBe(6); // 5 + 1
    });

    // COVERS LINE 99: The || 0 fallback in addTransaction when parseFloat returns NaN
    it('14. addTransaction should handle invalid amount and default to 0', () => {
        const invalidTransaction: Transaction = {
            id: 1,
            description: 'Transaction with invalid amount',
            date: '2025-01-01',
            amount: 'not a number' as any, // Force invalid amount
            transactionType: 'Income',
        };

        store.addTransaction(invalidTransaction);

        // The parseFloat should return NaN, and the || 0 should kick in
        expect(store.transactions[0].amount).toBe(0);
        expect(store.transactions.length).toBe(1);
    });

    // COVERS LINE 99: Alternative test with NaN input
    it('15. addTransaction should handle NaN amount and default to 0', () => {
        const nanTransaction: Transaction = {
            id: 2,
            description: 'Transaction with NaN',
            date: '2025-01-01',
            amount: NaN,
            transactionType: 'Expense',
        };

        store.addTransaction(nanTransaction);

        // The parseFloat(String(NaN)) returns NaN, so || 0 should apply
        expect(store.transactions[0].amount).toBe(0);
    });

    // COVERS LINE 110: The || 0 fallback in updateTransaction when parseFloat returns NaN
    it('16. updateTransaction should handle invalid amount and default to 0', () => {
        // First add a valid transaction
        const validTransaction: Transaction = {
            id: 1,
            description: 'Valid transaction',
            date: '2025-01-01',
            amount: 500,
            transactionType: 'Income',
        };
        store.addTransaction(validTransaction);

        // Now update it with invalid amount
        const invalidUpdate: Transaction = {
            id: 1,
            description: 'Updated transaction',
            date: '2025-01-01',
            amount: 'invalid' as any, // Force invalid amount
            transactionType: 'Income',
        };

        store.updateTransaction(invalidUpdate);

        // The parseFloat should return NaN, and the || 0 should kick in
        const updated = store.transactions.find(t => t.id === 1);
        expect(updated!.amount).toBe(0);
    });

    // COVERS LINE 110: Alternative test with NaN input
    it('17. updateTransaction should handle NaN amount and default to 0', () => {
        // First add a valid transaction
        const validTransaction: Transaction = {
            id: 1,
            description: 'Valid transaction',
            date: '2025-01-01',
            amount: 1000,
            transactionType: 'Expense',
        };
        store.addTransaction(validTransaction);

        // Update with NaN
        const nanUpdate: Transaction = {
            id: 1,
            description: 'Updated with NaN',
            date: '2025-01-01',
            amount: NaN,
            transactionType: 'Expense',
        };

        store.updateTransaction(nanUpdate);

        const updated = store.transactions.find(t => t.id === 1);
        expect(updated!.amount).toBe(0);
    });

    // Additional edge case: empty string amount
    it('18. addTransaction should handle empty string amount and default to 0', () => {
        const emptyStringTransaction: Transaction = {
            id: 3,
            description: 'Empty string amount',
            date: '2025-01-01',
            amount: '' as any,
            transactionType: 'Income',
        };

        store.addTransaction(emptyStringTransaction);

        // parseFloat('') returns NaN, so || 0 should apply
        expect(store.transactions[0].amount).toBe(0);
    });
});