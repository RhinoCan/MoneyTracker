export type TransactionType = Exclude<AmountType, "Balance">;
export type Transaction = {
    id: number;
    description: string;
    date: string;
    transactionType: TransactionType;
    amount: number;
};
export type AmountType = "Income" | "Expense" | "Balance";
export const TransactionTypeValues = {
  Income: 'Income' as const,
  Expense: 'Expense' as const,
};