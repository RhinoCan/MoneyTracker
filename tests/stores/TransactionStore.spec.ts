import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransactionStore } from '@/stores/TransactionStore';
import { useOtherStore } from '@/stores/OtherStore';
import { Transaction } from '@/types/Transaction';
import { appName } from '@/utils/SystemDefaults';

// 1. Hoist the mocks so they are available to the mock factory immediately
const { mockSuccess, mockError } = vi.hoisted(() => ({
  mockSuccess: vi.fn(),
  mockError: vi.fn()
}));

// 2. Mock vue-toastification using the hoisted variables
vi.mock('vue-toastification', () => ({
  useToast: vi.fn(() => ({
    success: mockSuccess,
    error: mockError,
  })),
}));

// 3. Mock SystemDefaults
vi.mock('@/utils/SystemDefaults.ts', () => ({
  appName: 'TestApp',
  defaultToastTimeout: 3000
}));

type TransactionStoreInstance = ReturnType<typeof useTransactionStore>;

// Mock transaction data
const MOCK_INCOME: Transaction = {
  id: 1,
  description: 'Salary Deposit',
  date: '2025-01-01',
  amount: 5000,
  transactionType: 'Income',
};

const MOCK_EXPENSE: Transaction = {
  id: 2,
  description: 'Monthly Rent',
  date: '2025-01-05',
  amount: 1500,
  transactionType: 'Expense',
};

const MOCK_TRANSACTIONS: Transaction[] = [MOCK_INCOME, MOCK_EXPENSE];

describe('TransactionStore', () => {
  beforeEach(() => {
    // 4. Reset modules ensures stores re-import the mocked toast for every test
    vi.resetModules();
    setActivePinia(createPinia());
    localStorage.clear();

    // Clear mock history
    mockSuccess.mockClear();
    mockError.mockClear();
  });

  describe('Initialization', () => {
    it('should initialize with empty array when no localStorage exists', () => {
      const store = useTransactionStore();
      expect(store.transactions).toEqual([]);
    });

    it('should successfully load transactions from localStorage', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify([MOCK_INCOME]));

      const store = useTransactionStore();
      expect(store.transactions.length).toBe(1);
      expect(store.transactions[0].description).toBe('Salary Deposit');
    });

    it('should handle failed localStorage parsing and log error', () => {
      const storageKey = `${appName}.Transaction`;
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem(storageKey, 'This is definitely not JSON');

      const store = useTransactionStore();
      expect(store.transactions.length).toBe(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to parse transactions from local storage:",
        expect.any(SyntaxError)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Getters', () => {
    let store: TransactionStoreInstance;

    beforeEach(() => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS));
      store = useTransactionStore();
    });

    it('getIncome should correctly calculate total income', () => {
      expect(store.getIncome).toBe(5000.00);
    });

    it('getBalance should calculate the correct balance', () => {
      expect(store.getBalance).toBe(3500.00);
    });

    it('getNewId should return highest ID + 1', () => {
      expect(store.getNewId).toBe(3);
    });
  });

  describe('addTransaction', () => {
    it('should add a transaction and save to localStorage', () => {
      const store = useTransactionStore();
      store.addTransaction(MOCK_INCOME);
      expect(store.transactions.length).toBe(1);

      const saved = localStorage.getItem(`${appName}.Transaction`);
      expect(JSON.parse(saved!)).toEqual([MOCK_INCOME]);
    });

    it('should show success toast with correct timeout', () => {
      const store = useTransactionStore();
      store.addTransaction(MOCK_INCOME);

      expect(mockSuccess).toHaveBeenCalled();
      expect(mockSuccess.mock.calls[0][0]).toContain('Successfully added');
      expect(mockSuccess.mock.calls[0][1]).toHaveProperty('timeout');
    });
  });

  describe('updateTransaction', () => {
    it('should show success toast on successful update', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS));
      const store = useTransactionStore();

      const updated = { ...MOCK_INCOME, amount: 5500 };
      store.updateTransaction(updated);

      expect(mockSuccess).toHaveBeenCalled();
      expect(mockSuccess.mock.calls[0][0]).toContain('Succesfully updated');
    });

    it('should handle non-existent transaction and show error', () => {
      const store = useTransactionStore();
      const nonExistent = { ...MOCK_INCOME, id: 999 };
      store.updateTransaction(nonExistent);

      expect(mockError).toHaveBeenCalled();
      expect(mockError.mock.calls[0][0]).toContain('Could not find transaction');
    });
  });

  describe('deleteTransaction', () => {
    it('should show success toast on successful delete', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS));
      const store = useTransactionStore();

      store.deleteTransaction(1);
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockSuccess.mock.calls[0][0]).toContain('Successfully deleted');
    });
  });

  describe('Integration with OtherStore', () => {
    it('should use timeout from OtherStore for toasts', () => {
      const store = useTransactionStore();
      const otherStore = useOtherStore();

      // IMPORTANT: Adjust method name to match your actual store (setTimeout vs updateTimeout)
      otherStore.setTimeout(5000);

      store.addTransaction(MOCK_INCOME);

      expect(mockSuccess).toHaveBeenCalled();
      expect(mockSuccess.mock.calls[0][1]).toEqual({ timeout: 5000 });
    });
  });

  // Note: I've omitted some repeat edge cases for brevity,
  // but they follow the same pattern as above.
});