// @/stores/TransactionStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase, type Database } from "@/lib/supabase";
import { useUserStore } from "@/stores/UserStore";
import type { Transaction, NewTransaction } from "@/types/Transaction";
import { TransactionTypeValues } from "@/types/Transaction";
import { i18n } from "@/i18n/index";
import type { ComposerTranslation } from "vue-i18n";

// NOTE: Accessing i18n.global directly is the correct pattern for translating strings
// outside of components. useI18n() requires a Vue component setup context and cannot
// be called at the top level of a Pinia store. The cast is necessary because vue-i18n
// does not export a public type for the global composer object.
const t = (i18n.global as unknown as { t: ComposerTranslation }).t;

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

export class TransactionError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(message: string, code?: string, details?: string, hint?: string) {
    super(message);
    this.name = "TransactionError";
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export const useTransactionStore = defineStore("transactionStore", () => {
  const userStore = useUserStore();

  // --- State ---
  const transactions = ref<Transaction[]>([]);
  const isSyncing = ref(false);

  // --- Getters ---

  const getTotalIncome = computed(() =>
    transactions.value.reduce((runningTotal, tx) => {
      if (tx.transaction_type === TransactionTypeValues.Income && tx.amount) {
        return runningTotal + Number(tx.amount);
      }
      return runningTotal;
    }, 0)
  );

  const getTotalExpense = computed(() =>
    transactions.value.reduce((runningTotal, tx) => {
      if (tx.transaction_type === TransactionTypeValues.Expense && tx.amount) {
        return runningTotal + Number(tx.amount);
      }
      return runningTotal;
    }, 0)
  );

  const getNetBalance = computed(() => getTotalIncome.value - getTotalExpense.value);

  // --- Internal Helpers ---

  const getRequiredUserId = () => {
    if (!userStore.userId) throw new Error("User ID is required for Transaction operations");
    return userStore.userId;
  };

  // NOTE: supabaseError is typed as a plain object rather than 'any' to preserve
  // type safety while accommodating Supabase's inconsistent error type exports.
  function handleSupabaseError(
    supabaseError: { code: string; message: string; details: string; hint: string },
    operation: string
  ): never {
    const errorMessages: Record<string, string> = {
      "23505": t("transactionStore.duplicate"),
      "23502": t("transactionStore.null_violation"),
      "42501": t("transactionStore.denied"),
      "08006": t("transactionStore.connection_failed"),
    };

    const message = errorMessages[supabaseError.code] || `Failed to ${operation}.`;
    throw new TransactionError(message, supabaseError.code, supabaseError.details, supabaseError.hint);
  }

  // --- Actions ---

  // NOTE: The 'as any' cast on supabase.from() is intentional throughout this store.
  // Supabase's TypeScript client collapses chained query builder return types to 'never'
  // when using a typed Database schema. This is a known limitation of @supabase/supabase-js
  // (see github.com/supabase/supabase-js). The cast is safe because the Database type
  // in supabase.ts fully defines the expected shape of all data returned from these queries.

  /**
   * fetchTransactions
   * Loads all transactions for the current user from the database, ordered by date descending.
   */
  async function fetchTransactions() {
    isSyncing.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("transactions") as any)
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) handleSupabaseError(error, "fetchTransactions");
      transactions.value = data || [];
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * addTransaction
   * Inserts a new transaction for the current user and prepends it to the local list.
   */
  async function addTransaction(newTx: NewTransaction) {
    isSyncing.value = true;
    try {
      const userId = getRequiredUserId();
      const payload: TransactionInsert = {
        amount: newTx.amount,
        transaction_type: newTx.transaction_type,
        date: newTx.date,
        description: newTx.description,
        user_id: userId,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("transactions") as any)
        .insert([payload])
        .select();

      if (error) handleSupabaseError(error, "addTransaction");
      if (!data?.length) throw new TransactionError("Transaction creation failed.");

      transactions.value.unshift(data[0]);
      return data[0];
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * updateTransaction
   * Applies partial updates to an existing transaction and refreshes it in the local list.
   */
  async function updateTransaction(id: number, updates: Partial<NewTransaction>) {
    isSyncing.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("transactions") as any)
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select();

      if (error) handleSupabaseError(error, "updateTransaction");
      if (!data?.length) throw new TransactionError("Transaction update failed.");

      const index = transactions.value.findIndex((tx) => tx.id === id);
      if (index !== -1) transactions.value[index] = data[0];

      return data[0];
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * deleteTransaction
   * Removes a single transaction by ID from the database and the local list.
   */
  async function deleteTransaction(id: number) {
    isSyncing.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("transactions") as any)
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) handleSupabaseError(error, "deleteTransaction");
      transactions.value = transactions.value.filter((tx) => tx.id !== id);
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * deleteAllTransactions
   * Removes every transaction belonging to the current user from the database and clears the local list.
   */
  async function deleteAllTransactions() {
    isSyncing.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("transactions") as any)
        .delete()
        .eq("user_id", userId);

      if (error) handleSupabaseError(error, "deleteAllTransactions");
      transactions.value = [];
    } finally {
      isSyncing.value = false;
    }
  }

  return {
    transactions,
    loading: isSyncing,
    getNetBalance,
    getTotalIncome,
    getTotalExpense,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
  };
});
