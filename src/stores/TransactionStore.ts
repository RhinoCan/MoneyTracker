// src/stores/TransactionStore.ts

import { defineStore, storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { Transaction } from '@/types/Transaction.ts';
import { appName } from '@/utils/SystemDefaults.ts';
import { logException, logWarning, logSuccess } from "@/utils/Logger.ts";

// Use the Setup Store syntax: defineStore returns a function that defines the store.
export const useTransactionStore = defineStore('storeTransaction', () => {

    // ------------------------------------
    // 1. STATE (Formerly in state: {})
    // Use 'ref' to define reactive state properties.
    // ------------------------------------


    // Initialize state, often loading from local storage first.
    // Since this store is focused on CRUD, let's add initial loading logic here.
    const getStorageKey = (storeName: string) => `${appName}.${storeName}`;
    const getKey = getStorageKey("Transaction");
    const savedTransactions = localStorage.getItem(getKey);

    let initialTransactions: Transaction[] = [];
    if (savedTransactions) {
        try {
            initialTransactions = JSON.parse(savedTransactions);
        } catch (e) {
          logException(e, { module: "Transaction", action: "read from localStorage", data: savedTransactions });
          initialTransactions = [];

        }
    }

    const transactions = ref<Transaction[]>(initialTransactions);

    // ------------------------------------
    // 2. GETTERS (Formerly in getters: {}).
    // Use 'computed' to define getters. They can reference other getters/state directly.
    // ------------------------------------

    const getIncome = computed((): number => {
        // Use filter() to make a new array containing only Income transactions.
        const incomeTransactions: Transaction[] = transactions.value.filter(
            transaction => transaction.transactionType === 'Income'
        );

        // Use reduce() to sum up the Income transactions.
        const totalIncome = incomeTransactions.reduce(
            (accumulator, currentValue) => accumulator + currentValue.amount, 0
        );

        // Return the number, keeping two decimal places
        return Number(totalIncome.toFixed(2));
    });

    const getExpense = computed((): number => {
        // Use filter() to make a new array containing only Expense transactions.
        const expenseTransactions: Transaction[] = transactions.value.filter(
            transaction => transaction.transactionType === 'Expense'
        );

        // Use reduce() to sum up the Expense transactions.
        const totalExpense = expenseTransactions.reduce(
            (accumulator, currentValue) => accumulator + currentValue.amount, 0
        );

        // Return the number, keeping two decimal places
        return Number(totalExpense.toFixed(2));
    });

    const getBalance = computed((): number => {
        // Reference other computed properties/getters directly using their .value
        return Number((getIncome.value - getExpense.value).toFixed(2));
    });

    const getNewId = computed((): number => {
        if (transactions.value.length === 0) {
            return 1;
        }

        /* Use reduce() to find the transaction with the highest value of Id in the transactions array. */
        const transactionWithHighestId: Transaction = transactions.value.reduce((prev, current) => {
            return (prev && prev.id > current.id) ? prev : current;
        });

        // Return the highest existing Id + 1
        return transactionWithHighestId.id + 1;
    });

    // ------------------------------------
    // 3. ACTIONS (Formerly in actions: {})
    // Define them as regular functions. They access state via .value.
    // ------------------------------------

    // Helper function to save state to localStorage
    const saveToLocalStorage = () => {
      try {
        localStorage.setItem(getKey, JSON.stringify(transactions.value));
      } catch (e) {
        logException(e, { module: "Transaction", action: "write to localStorage", data: transactions.value.length});
      }
    };

    function addTransaction(newTransaction: Transaction): void {
      try {
        newTransaction.amount = parseFloat(String(newTransaction.amount)) || 0;

        /* Add the new transaction to the array in this store. */
        transactions.value.push(newTransaction);
        logSuccess(`Successfully added the transaction with id ${newTransaction.id}.`);

        /* Update the array in local storage. */
        saveToLocalStorage();
      } catch (e) {
        logException(e, { module: "Transaction", action: "Add", data: newTransaction.id});
      }
    }

    function updateTransaction(updatedTransaction: Transaction) {
      try {
        updatedTransaction.amount = parseFloat(String(updatedTransaction.amount)) || 0;

        /* Find the "original" version of the transaction via its id. */
        const foundIndex = transactions.value.findIndex(x => x.id == updatedTransaction.id);

        if (foundIndex !== -1) {
             /* Replace the transaction at the determined position with the updated transaction. */
            transactions.value[foundIndex] = updatedTransaction;
            logSuccess(`Succesfully updated the transaction with id ${updatedTransaction.id}.`);
            saveToLocalStorage();
        } else {
            logWarning(`Failed to find Transaction with Id ${updatedTransaction.id} so that it could be updated.`, { module: "Transaction", action: "update", data: "updatedTransaction.id"});
        }
      } catch (e) {
          logException(e, { module: "Transaction", action: "Update", data: updatedTransaction.id});
        }

    }

    function deleteTransaction(idOfTransactionToBeDeleted: number): void {
      try {
        /* Find the index of the transaction which is to be deleted. */
        const foundIndex = transactions.value.findIndex(x => x.id == idOfTransactionToBeDeleted);

        if (foundIndex === -1) {
          logWarning(`Delete failed: ID $[id} not found`, { module: "Transaction", action: "Delete" });
          return;
        }

        /* Delete the indicated transaction from the array. */
        transactions.value.splice(foundIndex, 1);
        logSuccess(`Successfully deleted the transaction with Id ${idOfTransactionToBeDeleted}.`);

        /* Update the array in local storage. */
        saveToLocalStorage();
      } catch (e) {
        logException(e, { module: "Transaction", action: "Delete", data: idOfTransactionToBeDeleted});
      }
    }

    // ------------------------------------
    // 4. RETURN (Expose everything needed by components)
    // ------------------------------------

    return {
        // State (ref)
        transactions,
        // Getters (computed)
        getBalance,
        getIncome,
        getExpense,
        getNewId,
        // Actions (functions)
        addTransaction,
        updateTransaction,
        deleteTransaction,
    }
});