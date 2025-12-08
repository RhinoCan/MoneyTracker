export type TransactionType = Exclude<AmountType, "Balance">;
export type Transaction = {
    id: number;
    description: string;
    transactionType: TransactionType;
    amount: number;
};
export type AmountType = "Income" | "Expense" | "Balance";
