import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransactionStore } from '@/stores/TransactionStore';
import { Transaction } from '@/types/Transaction';
import { appName } from '@/utils/SystemDefaults';

// Hoist the mock functions so they're available to the mock factory
const { mockLogException, mockLogWarning, mockLogInfo, mockLogSuccess } = vi.hoisted(() => ({
  mockLogException: vi.fn(),
  mockLogWarning: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogSuccess: vi.fn(),
}));

// Mock the Logger module using the hoisted functions
vi.mock('@/utils/Logger', () => ({
  logException: mockLogException,
  logWarning: mockLogWarning,
  logInfo: mockLogInfo,
  logSuccess: mockLogSuccess,
}));

// Mock SystemDefaults
vi.mock('@/utils/SystemDefaults.ts', () => ({
  appName: 'TestApp',
  defaultToastTimeout: 0
}));

type TransactionStoreInstance = ReturnType<typeof useTransactionStore>;

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

const MOCK_EXPENSE2: Transaction = {
  id: 9,
  description: 'Flight to Berlin',
  date: '2025-12-25',
  amount: 1200,
  transactionType: 'Expense',
}

const MOCK_EXPENSE3: Transaction = {
  id: 11,
  description: 'Haircut',
  date: '2025-12-29',
  amount: 'xxx' as unknown as number,
  transactionType: 'Expense',
}

const MOCK_TRANSACTIONS: Transaction[] = [MOCK_INCOME, MOCK_EXPENSE];

const MOCK_TRANSACTIONS2: Transaction[] = [MOCK_INCOME, MOCK_EXPENSE2, MOCK_EXPENSE];

describe('TransactionStore', () => {
  beforeEach(() => {
    vi.resetModules();
    setActivePinia(createPinia());
    localStorage.clear();
    mockLogException.mockClear();
    mockLogWarning.mockClear();
    mockLogSuccess.mockClear();
  });

  describe('Initialization', () => {
    it('Init > when no localStorage exists, then initialize with an empty array', () => {
      const store = useTransactionStore();
      expect(store.transactions).toEqual([]);
    });

    it('Init > when transactions exist in localStorage, then they should load successfully', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify([MOCK_INCOME]));

      const store = useTransactionStore();
      expect(store.transactions.length).toBe(1);
      expect(store.transactions[0].description).toBe('Salary Deposit');
    });

    it('Init > when localStorage parsing fails, then log the exception', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, 'This is definitely not JSON');

      const store = useTransactionStore();
      expect(store.transactions.length).toBe(0);
      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(SyntaxError),
        expect.objectContaining({
          module: 'Transaction',
          action: 'read from localStorage'
        })
      );
    });
  });

  describe('Getters', () => {
    let store: TransactionStoreInstance;

    beforeEach(() => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS));
      store = useTransactionStore();
    });

    it('Get > getIncome should correctly calculate total income', () => {
      expect(store.getIncome).toBe(5000.00);
    });

    it('Get > getExpense should correctly calculate total expense', () => {
      expect(store.getExpense).toBe(1500.00);
    });

    it('Get > getBalance should calculate the correct balance', () => {
      expect(store.getBalance).toBe(3500.00);
    });

    it('Get > when there are existing transactions, then getNewId should return highest ID + 1', () => {
      expect(store.getNewId).toBe(3);
    });

    it('Get > when there are multiple existing transactions and they are not in numeric order, then getNewId should return highest ID + 1', () => {
      setActivePinia(createPinia());
      localStorage.clear();
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS2));
      store = useTransactionStore();
      expect(store.transactions.length).toBe(3);
      expect(store.getNewId).toBe(10);
    })

    it('Get > when there are no existing transactions, then getNewId should return 1', () => {
      setActivePinia(createPinia());
      localStorage.clear();
      const store = useTransactionStore();
      expect(store.transactions.length).toBe(0);
      expect(store.getNewId).toBe(1);
    })
  });

  describe('addTransaction', () => {
    it('Add > when a new transaction is created, then it should be added to the transaction array and saved to localStorage', () => {
      const store = useTransactionStore();
      store.addTransaction(MOCK_INCOME);
      expect(store.transactions.length).toBe(1);

      const saved = localStorage.getItem(`${appName}.Transaction`);
      expect(JSON.parse(saved!)).toEqual([MOCK_INCOME]);
    });

    it('Add > when a new transaction is created, then it should log success message', () => {
      const store = useTransactionStore();

      store.addTransaction(MOCK_INCOME);

      expect(mockLogSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Successfully added')
      );
    });

    it('Add > when the add fails due to bad data, then log the exception', () => {
      const store = useTransactionStore();

      const spy = vi.spyOn(store.transactions, 'push').mockImplementation(() => {
        throw new Error("Unexpected push failure");
      });

      store.addTransaction(MOCK_EXPENSE3)

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({action: "Add", data: 11})
      );
    });

    it('Add > when the add fails due to an unexpected error, then log the exception', () => {
      const store = useTransactionStore();

      store.addTransaction(MOCK_EXPENSE3);

      const spy = vi.spyOn(store.transactions, 'push').mockImplementation(() => {
        throw new Error("Unexpected push failure");
      });

      store.addTransaction(MOCK_INCOME);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({action: "Add", data: 1})
      );

      spy.mockRestore();
    })
  });

  describe('updateTransaction', () => {
    it('Update > when an existing transaction is updated, then udpate the transaction in the array and log a success message', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS));
      const store = useTransactionStore();

      const updated = { ...MOCK_INCOME, amount: 5500 };
      store.updateTransaction(updated);

      expect(store.transactions[0].amount).toBe(5500);
      expect(mockLogSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Succesfully updated')
      );
    });

    it('Update > when an update comes for a non-existent transaction, then update nothing and log warning', () => {
      const store = useTransactionStore();
      const nonExistent = { ...MOCK_INCOME, id: 999 };

      store.updateTransaction(nonExistent);

      expect(mockLogWarning).toHaveBeenCalledWith(
        expect.stringContaining('Failed to find Transaction'),
        expect.any(Object)
      );
    });

    it('Update > when an update fails due to bad data, then log the exception', () => {
      const store = useTransactionStore();

      const spy = vi.spyOn(store.transactions, 'findIndex').mockImplementation(() => {
        throw new Error("Unexpected findIndex failure");
      })

      store.updateTransaction(MOCK_EXPENSE3)

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({action: "Update", data: 11})
      );
    });

    it('Update > when the update fails due to an unexpected error, then log the exception', () => {
      const store = useTransactionStore();
      store.transactions = [MOCK_EXPENSE];

      const spy = vi.spyOn(store.transactions, 'findIndex').mockImplementation(() => {
        throw new Error("Unexpected findIndex failure");
      });

      store.updateTransaction(MOCK_EXPENSE);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({action: "Update", data: 2})
      );

      spy.mockRestore();
    })
  });

  describe('deleteTransaction', () => {
    it('Delete > when an existing transaction is supposed to be deleted, then delete transaction and log success', () => {
      const storageKey = `${appName}.Transaction`;
      localStorage.setItem(storageKey, JSON.stringify(MOCK_TRANSACTIONS));
      const store = useTransactionStore();

      store.deleteTransaction(1);

      expect(store.transactions.length).toBe(1);
      expect(store.transactions[0].id).toBe(2);
      expect(mockLogSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Successfully deleted')
      );
    });

    it('Delete > when a non-existent transaction is to be deleted, delete nothing and log a warning', () => {
      const store = useTransactionStore();

      store.deleteTransaction(999);

      expect(mockLogWarning).toHaveBeenCalledWith(
        expect.stringContaining('Delete failed'),
        expect.any(Object)
      );
    });

    it('Delete > when the delete fails due to bad data, then log the exception', () => {
      const store = useTransactionStore();
      store.transactions = [MOCK_EXPENSE3];

      const spy = vi.spyOn(store.transactions, 'splice').mockImplementation(() => {
        throw new Error("Unexpected splice failure");
      })

      store.deleteTransaction(11);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({action: "Delete", data: 11})
      );
    });

    it('Delete > when the delete fails due to an unexpected error, then log the exception', () => {
      const store = useTransactionStore();
      store.transactions = [MOCK_EXPENSE];

      const spy = vi.spyOn(store.transactions, 'splice').mockImplementation(() => {
        throw new Error("Unexpected splice failure");
      });

      store.deleteTransaction(2);

      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({action: "Delete", data: 2})
      );

      spy.mockRestore();
    })
  });

  describe('Error handling', () => {
    it("Error > when localStorage quota is exceeded, then an exception should be logged", () => {
      const store = useTransactionStore();
      const spy = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new DOMException("QuotaExceededError");
        });

      store.addTransaction(MOCK_INCOME);
      expect(mockLogException).toHaveBeenCalledWith(
        expect.any(DOMException),
        expect.objectContaining({ module: "Transaction", action: "write to localStorage", data: 1 })
      );
      spy.mockRestore();
    });
  });
});