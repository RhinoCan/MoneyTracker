// @/stores/TransactionStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase, type Database } from "@/lib/supabase";
import { useUserStore } from "@/stores/UserStore";
import type { Transaction, NewTransaction } from "@/types/Transaction";
import { TransactionTypeValues } from "@/types/Transaction";
import { logException, logInfo, logSuccess } from "@/lib/Logger";
import { i18n } from "@/i18n/index";

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

export class TransactionError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "TransactionError";
    this.code = code;
  }
}

export const useTransactionStore = defineStore("storeTransaction", () => {
  const userStore = useUserStore();

  // --- State ---
  const transactions = ref<Transaction[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // --- Getters ---
  const getIncome = computed(() =>
    transactions.value.reduce(
      (acc, t) =>
        t.transaction_type === TransactionTypeValues.Income ? acc + Number(t.amount) : acc,
      0
    )
  );

  const getExpense = computed(() =>
    transactions.value.reduce(
      (acc, t) =>
        t.transaction_type === TransactionTypeValues.Expense ? acc + Number(t.amount) : acc,
      0
    )
  );

  const getBalance = computed(() => getIncome.value - getExpense.value);

  // --- Helpers ---
  const getRequiredUserId = () => {
    if (!userStore.userId) throw new Error("User ID is required for Transaction operations");
    return userStore.userId;
  };

  // NOTE: supabaseError is typed as a plain object rather than 'any' to preserve
  // type safety while accommodating Supabase's inconsistent error type exports.
  function handleSupabaseError(
    supabaseError: { code: string; details: string; hint: string; message: string },
    operation: string
  ): never {
    const errorMessages: Record<string, string> = {
      "23505": "This transaction already exists.",
      "42501": "Permission denied.",
      "08006": "Database connection failed.",
    };

    const message = errorMessages[supabaseError.code] || `Failed to ${operation}.`;

    logException(supabaseError, {
      module: "TransactionStore",
      action: operation,
      slug: `db.${supabaseError.code || "unknown"}`,
      data: { details: supabaseError.details, hint: supabaseError.hint },
    });

    throw new TransactionError(message, supabaseError.code);
  }

  // --- Actions ---

  // NOTE: The 'as any' cast on supabase.from() is intentional throughout this store.
  // Supabase's TypeScript client collapses chained query builder return types to 'never'
  // when using a typed Database schema. This is a known limitation of @supabase/supabase-js
  // (see github.com/supabase/supabase-js). The cast is safe because the Database type
  // in supabase.ts fully defines the expected shape of all data returned from these queries.

  // NOTE: The 'as any' cast on i18n.global is intentional throughout this store.
  // useI18n() requires a Vue component setup context and cannot be called at the top
  // level of a Pinia store. Accessing i18n.global directly is the correct pattern for
  // translating strings outside of components. The cast is necessary because vue-i18n
  // does not export a public type for the global composer object.

  async function fetchTransactions() {
    loading.value = true;
    error.value = null;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: supabaseError } = await (supabase.from("transactions") as any)
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (supabaseError) handleSupabaseError(supabaseError, "fetchTransactions");

      transactions.value = data || [];
      logInfo("The transactions were fetched.", {
        module: "TransactionStore",
        action: "fetchTransactions",
        data: { count: transactions.value.length },
      });
    } catch (err) {
      error.value = (err as Error).message;
    } finally {
      loading.value = false;
    }
  }

  async function addTransaction(newTx: Omit<NewTransaction, "user_id">) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (i18n.global as any).t;
    loading.value = true;
    try {
      const userId = getRequiredUserId();
      const payload: TransactionInsert = { ...newTx, user_id: userId };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: supabaseError } = await (supabase.from("transactions") as any)
        .insert([payload])
        .select();

      if (supabaseError) handleSupabaseError(supabaseError, "addTransaction");
      if (!data?.length) throw new TransactionError("Creation failed.");

      transactions.value.unshift(data[0]);

      logSuccess(t("transactionStore.added"), {
        module: "TransactionStore",
        action: "addTransaction"
      });

      return data[0];
    } catch (err) {
      if (!(err instanceof TransactionError)) {
        logException(err, {
          module: "TransactionStore",
          action: "addTransaction",
          slug: t("transactionStore.add_failed"),
        });
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTransaction(id: number, updates: Partial<NewTransaction>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (i18n.global as any).t;
    loading.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: supabaseError } = await (supabase.from("transactions") as any)
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select();

      if (supabaseError) handleSupabaseError(supabaseError, "updateTransaction");

      const index = transactions.value.findIndex((t) => t.id === id);
      if (index !== -1) transactions.value[index] = data[0];

      logSuccess(t("transactionStore.updated"), {
        module: "TransactionStore",
        action: "updateTransaction"
      });

      return data[0];
    } catch (err) {
      if (!(err instanceof TransactionError)) {
        logException(err, {
          module: "TransactionStore",
          action: "updateTransaction",
          slug: t("transactionStore.update_failed"),
        });
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTransaction(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (i18n.global as any).t;
    loading.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: supabaseError } = await (supabase.from("transactions") as any)
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (supabaseError) handleSupabaseError(supabaseError, "deleteTransaction");

      transactions.value = transactions.value.filter((t) => t.id !== id);

      logSuccess(t("transactionStore.deleteOne"), {
        module: "TransactionStore",
        action: "deleteTransaction"
      });
    } catch (err) {
      if (!(err instanceof TransactionError)) {
        logException(err, {
          module: "TransactionStore",
          action: "deleteTransaction",
          slug: t("transactionStore.deleteOne_failed"),
        });
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAllTransactions() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (i18n.global as any).t;
    loading.value = true;
    try {
      const userId = getRequiredUserId();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: supabaseError } = await (supabase.from("transactions") as any)
        .delete()
        .eq("user_id", userId);

      if (supabaseError) handleSupabaseError(supabaseError, "deleteAllTransactions");

      const count = transactions.value.length;
      transactions.value = [];

      logSuccess(t("transactionStore.deleteAll"), {
        module: "TransactionStore",
        action: "deleteAllTransactions",
        data: { deletedCount: count },
      });
    } catch (err) {
      if (!(err instanceof TransactionError)) {
        logException(err, {
          module: "TransactionStore",
          action: "deleteAllTransactions",
          slug: t("transactionStore.deleteAll_failed"),
        });
      }
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    transactions,
    loading,
    error,
    getBalance,
    getIncome,
    getExpense,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
  };
});