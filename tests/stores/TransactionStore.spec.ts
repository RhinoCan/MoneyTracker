import { setActivePinia, createPinia } from "pinia";
import { useTransactionStore } from "@/stores/TransactionStore.ts";
import { describe, it, expect, beforeEach, vi } from "vitest"; // Added vi for mocking

// Mock toastification
vi.mock("vue-toastification", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock localStorage for test isolation
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Replace global localStorage
Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
});

describe("Tracker Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  // ---------------------------------------------------------------
  // INITIAL STATE
  // ---------------------------------------------------------------
  it("starts with an empty transactions array", () => {
    const store = useTransactionStore();
    expect(store.transactions).toEqual([]);
  });

  // ---------------------------------------------------------------
  // ADD TRANSACTION
  // ---------------------------------------------------------------
  it("adds a new transaction", () => {
    const store = useTransactionStore();

    store.addTransaction({
      id: 1,
      description: "Salary",
      transactionType: "Income",
      amount: 2500,
    });

    expect(store.transactions.length).toBe(1);
    expect(store.transactions[0]).toMatchObject({
      id: 1,
      description: "Salary",
      transactionType: "Income",
      amount: 2500,
    });

    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("coerces string amounts to numbers when adding a transaction", () => {
    const store = useTransactionStore();

    // Pass amount as a string (simulating form input)
    store.addTransaction({
      id: 1,
      description: "String Salary",
      transactionType: "Income",
      amount: "3500.50" as any, // Use 'as any' for test purposes
    });

    expect(store.transactions.length).toBe(1);
    // CRITICAL CHECK: Ensure the amount is stored as a number
    expect(store.transactions[0].amount).toBe(3500.5);
    expect(typeof store.transactions[0].amount).toBe("number");

    // Check that localStorage stores the stringified array correctly
    const savedData = JSON.parse(
      mockLocalStorage.getItem("transactions") as string
    );
    expect(savedData[0].amount).toBe(3500.5);
  });

  // ---------------------------------------------------------------
  // UPDATE TRANSACTION
  // ---------------------------------------------------------------
  it("updates an existing transaction", () => {
    const store = useTransactionStore();

    store.transactions = [
      {
        id: 1,
        description: "Groceries",
        transactionType: "Expense",
        amount: 100,
      },
    ];

    store.updateTransaction({
      id: 1,
      description: "Groceries + Snacks",
      transactionType: "Expense",
      amount: 140,
    });

    expect(store.transactions[0]).toMatchObject({
      id: 1,
      description: "Groceries + Snacks",
      transactionType: "Expense",
      amount: 140,
    });

    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("coerces string amounts to numbers when updating a transaction", () => {
    const store = useTransactionStore();

    store.transactions = [
      {
        id: 1,
        description: "Old Amount",
        transactionType: "Expense",
        amount: 100,
      },
    ];

    // Pass the new amount as a string (simulating form input)
    store.updateTransaction({
      id: 1,
      description: "New Amount as String",
      transactionType: "Expense",
      amount: "55.99" as any, // Use 'as any' for test purposes
    });

    expect(store.transactions[0].description).toBe("New Amount as String");
    // CRITICAL CHECK: Ensure the amount is updated and stored as a number
    expect(store.transactions[0].amount).toBe(55.99);
    expect(typeof store.transactions[0].amount).toBe("number");

    // Check that localStorage stores the stringified array correctly
    const savedData = JSON.parse(
      mockLocalStorage.getItem("transactions") as string
    );
    expect(savedData[0].amount).toBe(55.99);
  });

  // ---------------------------------------------------------------
  // DELETE TRANSACTION — SUCCESS
  // ---------------------------------------------------------------
  it("deletes an existing transaction", () => {
    const store = useTransactionStore();

    store.transactions = [
      { id: 1, description: "A", transactionType: "Income", amount: 10 },
      { id: 2, description: "B", transactionType: "Expense", amount: 5 },
    ];

    store.deleteTransaction(1);

    expect(store.transactions.length).toBe(1);
    expect(store.transactions[0].id).toBe(2);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // DELETE TRANSACTION — FAILS IF NOT FOUND
  // ---------------------------------------------------------------
  it("does not delete a transaction if ID does not exist", () => {
    const store = useTransactionStore();

    store.transactions = [
      { id: 5, description: "Test", transactionType: "Income", amount: 20 },
    ];

    store.deleteTransaction(999);

    expect(store.transactions.length).toBe(1); // unchanged
  });

  // ---------------------------------------------------------------
  // GETTERS: NEW ID
  // ---------------------------------------------------------------
  it("computes the next new ID", () => {
    const store = useTransactionStore();

    store.transactions = [
      { id: 10, description: "A", transactionType: "Income", amount: 10 },
      { id: 20, description: "B", transactionType: "Expense", amount: 5 },
    ];

    expect(store.getNewId).toBe(21);
  });

  // ---------------------------------------------------------------
  // GETTERS: INCOME / EXPENSE / BALANCE
  // ---------------------------------------------------------------
  it("computes income, expense, and balance correctly", () => {
    const store = useTransactionStore();

    store.transactions = [
      { id: 1, description: "Salary", transactionType: "Income", amount: 3000 },
      {
        id: 2,
        description: "Groceries",
        transactionType: "Expense",
        amount: 250,
      },
      { id: 3, description: "Gift", transactionType: "Income", amount: 100 },
      {
        id: 4,
        description: "Utilities",
        transactionType: "Expense",
        amount: 120,
      },
    ];

    expect(store.getIncome).toBe(3100);
    expect(store.getExpense).toBe(370);
    expect(store.getBalance).toBe(2730);
  });

  it("computes income, expense, and balance correctly with floating point math", () => {
    const store = useTransactionStore();

    store.transactions = [
      {
        id: 1,
        description: "Small Income",
        transactionType: "Income",
        amount: 1.05,
      },
      {
        id: 2,
        description: "Small Expense",
        transactionType: "Expense",
        amount: 0.02,
      },
      {
        id: 3,
        description: "Another Income",
        transactionType: "Income",
        amount: 10.99,
      },
    ];

    // Income: 1.05 + 10.99 = 12.04
    expect(store.getIncome).toBe(12.04);
    // Expense: 0.02
    expect(store.getExpense).toBe(0.02);
    // Balance: 12.04 - 0.02 = 12.02
    expect(store.getBalance).toBe(12.02);
  });
});
