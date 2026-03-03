// tests/stores/TransactionStore.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTransactionStore, TransactionError } from "@/stores/TransactionStore";
import { useUserStore } from "@/stores/UserStore";
import type { Transaction } from "@/types/Transaction";

// -------------------------------------------------------------------------
// Mock Supabase
// All methods return `this` by default so chains work.
// Terminal methods (select after insert/update, delete chain end) resolve.
// -------------------------------------------------------------------------
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [], error: null }),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseChain),
  },
}));

// -------------------------------------------------------------------------
// Mock i18n
// -------------------------------------------------------------------------
vi.mock("@/i18n/index", () => ({
  i18n: {
    global: {
      t: (key: string) => key,
      te: () => false,
      locale: { value: "en-US" },
    },
  },
}));

// -------------------------------------------------------------------------
// Test fixtures
// -------------------------------------------------------------------------
const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  description: "Test transaction",
  date: "2025-06-15",
  transaction_type: "Expense",
  amount: 100,
  user_id: "user-123",
  ...overrides,
});

describe("TransactionStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Reset chain defaults
    mockSupabaseChain.select.mockReturnThis();
    mockSupabaseChain.eq.mockReturnThis();
    mockSupabaseChain.order.mockResolvedValue({ data: [], error: null });
    mockSupabaseChain.insert.mockReturnThis();
    mockSupabaseChain.update.mockReturnThis();
    mockSupabaseChain.delete.mockReturnThis();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("transactions is an empty array", () => {
      const store = useTransactionStore();
      expect(store.transactions).toEqual([]);
    });

    it("loading is false", () => {
      const store = useTransactionStore();
      expect(store.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Computed getters
  // -------------------------------------------------------------------------
  describe("computed getters", () => {
    it("getTotalIncome sums only Income transactions", () => {
      const store = useTransactionStore();
      store.transactions = [
        makeTransaction({ transaction_type: "Income", amount: 500 }),
        makeTransaction({ id: 2, transaction_type: "Income", amount: 300 }),
        makeTransaction({ id: 3, transaction_type: "Expense", amount: 200 }),
      ];
      expect(store.getTotalIncome).toBe(800);
    });

    it("getTotalExpense sums only Expense transactions", () => {
      const store = useTransactionStore();
      store.transactions = [
        makeTransaction({ transaction_type: "Expense", amount: 150 }),
        makeTransaction({ id: 2, transaction_type: "Expense", amount: 50 }),
        makeTransaction({ id: 3, transaction_type: "Income", amount: 500 }),
      ];
      expect(store.getTotalExpense).toBe(200);
    });

    it("getNetBalance is income minus expense", () => {
      const store = useTransactionStore();
      store.transactions = [
        makeTransaction({ transaction_type: "Income", amount: 1000 }),
        makeTransaction({ id: 2, transaction_type: "Expense", amount: 400 }),
      ];
      expect(store.getNetBalance).toBe(600);
    });

    it("getNetBalance is negative when expenses exceed income", () => {
      const store = useTransactionStore();
      store.transactions = [
        makeTransaction({ transaction_type: "Income", amount: 100 }),
        makeTransaction({ id: 2, transaction_type: "Expense", amount: 300 }),
      ];
      expect(store.getNetBalance).toBe(-200);
    });

    it("all getters return 0 when transactions is empty", () => {
      const store = useTransactionStore();
      expect(store.getTotalIncome).toBe(0);
      expect(store.getTotalExpense).toBe(0);
      expect(store.getNetBalance).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // TransactionError class
  // -------------------------------------------------------------------------
  describe("TransactionError", () => {
    it("is an instance of Error", () => {
      const err = new TransactionError("test");
      expect(err).toBeInstanceOf(Error);
    });

    it("has name TransactionError", () => {
      const err = new TransactionError("test");
      expect(err.name).toBe("TransactionError");
    });

    it("stores code, details, and hint", () => {
      const err = new TransactionError("msg", "23505", "details", "hint");
      expect(err.code).toBe("23505");
      expect(err.details).toBe("details");
      expect(err.hint).toBe("hint");
    });
  });

  // -------------------------------------------------------------------------
  // userId guard
  // -------------------------------------------------------------------------
  describe("userId guard", () => {
    it("fetchTransactions throws when userId is null", async () => {
      const store = useTransactionStore();
      await expect(store.fetchTransactions()).rejects.toThrow("User ID is required");
    });

    it("addTransaction throws when userId is null", async () => {
      const store = useTransactionStore();
      await expect(
        store.addTransaction({ description: "x", date: "2025-01-01", transaction_type: "Expense", amount: 10 })
      ).rejects.toThrow("User ID is required");
    });

    it("updateTransaction throws when userId is null", async () => {
      const store = useTransactionStore();
      await expect(store.updateTransaction(1, { amount: 50 })).rejects.toThrow("User ID is required");
    });

    it("deleteTransaction throws when userId is null", async () => {
      const store = useTransactionStore();
      await expect(store.deleteTransaction(1)).rejects.toThrow("User ID is required");
    });

    it("deleteAllTransactions throws when userId is null", async () => {
      const store = useTransactionStore();
      await expect(store.deleteAllTransactions()).rejects.toThrow("User ID is required");
    });
  });

  // -------------------------------------------------------------------------
  // fetchTransactions
  // -------------------------------------------------------------------------
  describe("fetchTransactions", () => {
    beforeEach(() => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };
    });

    it("populates transactions from database response", async () => {
      const txList = [makeTransaction(), makeTransaction({ id: 2, amount: 200 })];
      mockSupabaseChain.order.mockResolvedValue({ data: txList, error: null });

      const store = useTransactionStore();
      await store.fetchTransactions();

      expect(store.transactions).toEqual(txList);
    });

    it("sets transactions to empty array when data is null", async () => {
      mockSupabaseChain.order.mockResolvedValue({ data: null, error: null });

      const store = useTransactionStore();
      await store.fetchTransactions();

      expect(store.transactions).toEqual([]);
    });

    it("sets loading to false after completion", async () => {
      const store = useTransactionStore();
      await store.fetchTransactions();
      expect(store.loading).toBe(false);
    });

    it("throws TransactionError on database error", async () => {
      mockSupabaseChain.order.mockResolvedValue({
        data: null,
        error: { code: "08006", message: "connection failed", details: "", hint: "" },
      });

      const store = useTransactionStore();
      await expect(store.fetchTransactions()).rejects.toBeInstanceOf(TransactionError);
    });

    it("sets loading to false even when an error occurs", async () => {
      mockSupabaseChain.order.mockResolvedValue({
        data: null,
        error: { code: "08006", message: "fail", details: "", hint: "" },
      });

      const store = useTransactionStore();
      await expect(store.fetchTransactions()).rejects.toThrow();
      expect(store.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // addTransaction
  // -------------------------------------------------------------------------
  describe("addTransaction", () => {
    beforeEach(() => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };
    });

    it("prepends the new transaction to the local list", async () => {
      const newTx = makeTransaction({ id: 99, description: "New one" });
      mockSupabaseChain.select.mockResolvedValue({ data: [newTx], error: null });

      const store = useTransactionStore();
      store.transactions = [makeTransaction()];

      await store.addTransaction({
        description: "New one",
        date: "2025-06-15",
        transaction_type: "Expense",
        amount: 100,
      });

      expect(store.transactions[0]).toEqual(newTx);
      expect(store.transactions).toHaveLength(2);
    });

    it("returns the created transaction", async () => {
      const newTx = makeTransaction({ id: 99 });
      mockSupabaseChain.select.mockResolvedValue({ data: [newTx], error: null });

      const store = useTransactionStore();
      const result = await store.addTransaction({
        description: "Test",
        date: "2025-06-15",
        transaction_type: "Income",
        amount: 50,
      });

      expect(result).toEqual(newTx);
    });

    it("throws TransactionError when data is empty", async () => {
      mockSupabaseChain.select.mockResolvedValue({ data: [], error: null });

      const store = useTransactionStore();
      await expect(
        store.addTransaction({ description: "x", date: "2025-01-01", transaction_type: "Expense", amount: 10 })
      ).rejects.toBeInstanceOf(TransactionError);
    });

    it("throws TransactionError on database error (covers line 136)", async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate", details: "", hint: "" },
      });

      const store = useTransactionStore();
      await expect(
        store.addTransaction({ description: "x", date: "2025-01-01", transaction_type: "Expense", amount: 10 })
      ).rejects.toBeInstanceOf(TransactionError);
    });

    it("sets loading to false after completion", async () => {
      const newTx = makeTransaction({ id: 99 });
      mockSupabaseChain.select.mockResolvedValue({ data: [newTx], error: null });

      const store = useTransactionStore();
      await store.addTransaction({ description: "x", date: "2025-01-01", transaction_type: "Expense", amount: 10 });
      expect(store.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // updateTransaction
  // -------------------------------------------------------------------------
  describe("updateTransaction", () => {
    beforeEach(() => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };
    });

    it("updates the transaction in the local list", async () => {
      const original = makeTransaction({ id: 1, amount: 100 });
      const updated = makeTransaction({ id: 1, amount: 250 });
      mockSupabaseChain.select.mockResolvedValue({ data: [updated], error: null });

      const store = useTransactionStore();
      store.transactions = [original];

      await store.updateTransaction(1, { amount: 250 });

      expect(store.transactions[0].amount).toBe(250);
    });

    it("returns the updated transaction", async () => {
      const updated = makeTransaction({ id: 1, amount: 250 });
      mockSupabaseChain.select.mockResolvedValue({ data: [updated], error: null });

      const store = useTransactionStore();
      store.transactions = [makeTransaction()];

      const result = await store.updateTransaction(1, { amount: 250 });
      expect(result).toEqual(updated);
    });

    it("throws TransactionError when data is empty", async () => {
      mockSupabaseChain.select.mockResolvedValue({ data: [], error: null });

      const store = useTransactionStore();
      store.transactions = [makeTransaction()];

      await expect(store.updateTransaction(1, { amount: 50 })).rejects.toBeInstanceOf(TransactionError);
    });

    it("throws TransactionError on database error (covers line 161)", async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: { code: "42501", message: "permission denied", details: "", hint: "" },
      });

      const store = useTransactionStore();
      store.transactions = [makeTransaction()];

      await expect(store.updateTransaction(1, { amount: 50 })).rejects.toBeInstanceOf(TransactionError);
    });

    it("sets loading to false after completion", async () => {
      const updated = makeTransaction({ id: 1, amount: 250 });
      mockSupabaseChain.select.mockResolvedValue({ data: [updated], error: null });

      const store = useTransactionStore();
      store.transactions = [makeTransaction()];

      await store.updateTransaction(1, { amount: 250 });
      expect(store.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // deleteTransaction
  // -------------------------------------------------------------------------
  describe("deleteTransaction", () => {
    beforeEach(() => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };
      // No eq mock here — each test sets up its own
    });

    it("removes the transaction from the local list", async () => {
      mockSupabaseChain.eq
        .mockReturnValueOnce(mockSupabaseChain)
        .mockResolvedValueOnce({ error: null });

      const store = useTransactionStore();
      store.transactions = [
        makeTransaction({ id: 1 }),
        makeTransaction({ id: 2, amount: 200 }),
      ];

      await store.deleteTransaction(1);

      expect(store.transactions).toHaveLength(1);
      expect(store.transactions[0].id).toBe(2);
    });

    it("throws TransactionError on database error (covers line 187)", async () => {
      mockSupabaseChain.eq
        .mockReturnValueOnce(mockSupabaseChain)
        .mockResolvedValueOnce({ error: { code: "08006", message: "connection failed", details: "", hint: "" } });

      const store = useTransactionStore();
      store.transactions = [makeTransaction({ id: 1 })];

      await expect(store.deleteTransaction(1)).rejects.toBeInstanceOf(TransactionError);
      expect(store.loading).toBe(false);
    });

    it("sets loading to false after completion", async () => {
      mockSupabaseChain.eq
        .mockReturnValueOnce(mockSupabaseChain)
        .mockResolvedValueOnce({ error: null });

      const store = useTransactionStore();
      store.transactions = [makeTransaction()];

      await store.deleteTransaction(1);
      expect(store.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // deleteAllTransactions
  // -------------------------------------------------------------------------
  describe("deleteAllTransactions", () => {
    beforeEach(() => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };
      // No eq mock here — each test sets up its own
    });

    it("clears the local transactions array", async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({ error: null });

      const store = useTransactionStore();
      store.transactions = [makeTransaction(), makeTransaction({ id: 2 })];

      await store.deleteAllTransactions();

      expect(store.transactions).toEqual([]);
    });

    it("throws TransactionError on database error (covers line 207)", async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({
        error: { code: "08006", message: "connection failed", details: "", hint: "" },
      });

      const store = useTransactionStore();
      await expect(store.deleteAllTransactions()).rejects.toBeInstanceOf(TransactionError);
      expect(store.loading).toBe(false);
    });

    it("sets loading to false after completion", async () => {
      mockSupabaseChain.eq.mockResolvedValueOnce({ error: null });

      const store = useTransactionStore();
      await store.deleteAllTransactions();
      expect(store.loading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // handleSupabaseError — known error codes
  // -------------------------------------------------------------------------
  describe("handleSupabaseError via fetchTransactions", () => {
    beforeEach(() => {
      const userStore = useUserStore();
      // @ts-ignore
      userStore.user = { id: "user-123" };
      // Explicitly reset the full chain so forEach tests don't bleed
      mockSupabaseChain.select.mockReturnThis();
      mockSupabaseChain.eq.mockReturnThis();
    });

    const errorCodes = ["23505", "23502", "42501", "08006"];

    errorCodes.forEach((code) => {
      it(`throws TransactionError for Supabase error code ${code}`, async () => {
        mockSupabaseChain.order.mockResolvedValueOnce({
          data: null,
          error: { code, message: "db error", details: "", hint: "" },
        });

        const store = useTransactionStore();
        await expect(store.fetchTransactions()).rejects.toBeInstanceOf(TransactionError);
      });
    });

    it("throws TransactionError with the error code preserved", async () => {
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate", details: "", hint: "" },
      });

      const store = useTransactionStore();
      try {
        await store.fetchTransactions();
      } catch (err) {
        expect(err).toBeInstanceOf(TransactionError);
        expect((err as TransactionError).code).toBe("23505");
      }
    });

    it("uses fallback message for unknown error code (covers line 82)", async () => {
      mockSupabaseChain.order.mockResolvedValueOnce({
        data: null,
        error: { code: "99999", message: "unknown", details: "", hint: "" },
      });

      const store = useTransactionStore();
      try {
        await store.fetchTransactions();
      } catch (err) {
        expect(err).toBeInstanceOf(TransactionError);
        expect((err as TransactionError).message).toBe("Failed to fetchTransactions.");
      }
    });
  });
});