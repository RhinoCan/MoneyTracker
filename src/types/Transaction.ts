export type AmountType = "Income" | "Expense" | "Balance";

export type TransactionType = Exclude<AmountType, "Balance">;

export type Transaction = {
  id: number;
  description: string;
  date: string;
  transaction_type: TransactionType;
  amount: number;
  user_id: string; // Add database fields
  created_at?: string; // Optional since it has a default
};

// New transaction without database-generated fields
export type NewTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

export const TransactionTypeValues = {
  Income: 'Income' as const,
  Expense: 'Expense' as const,
};