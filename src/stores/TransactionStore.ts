// src/stores/TransactionStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue' // <-- Composition API imports needed here
import { useToast } from 'vue-toastification';
import { Transaction } from '@/types/Transaction.ts';

const toast = useToast();

// Use the Setup Store syntax: defineStore returns a function that defines the store.
export const useTransactionStore = defineStore('storeTransaction', () => {
 
    // ------------------------------------
    // 1. STATE (Formerly in state: {})
    // Use 'ref' to define reactive state properties.
    // ------------------------------------

    // Initialize state, often loading from local storage first.
    // Since this store is focused on CRUD, let's add initial loading logic here.
    const savedTransactions = localStorage.getItem('transactions');
    let initialTransactions: Transaction[] = [];
    if (savedTransactions) {
        try {
            initialTransactions = JSON.parse(savedTransactions);
        } catch (e) {
            console.error("Failed to parse transactions from local storage:", e);
        }
    }

    const transactions = ref<Transaction[]>(initialTransactions);


    // ------------------------------------
    // 2. GETTERS (Formerly in getters: {})
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
        localStorage.setItem('transactions', JSON.stringify(transactions.value));
    };

    function addTransaction(newTransaction: Transaction): void {
        newTransaction.amount = parseFloat(String(newTransaction.amount)) || 0;

        /* Add the new transaction to the array in this store. */
        transactions.value.push(newTransaction);
        toast.success("Successfully added the transaction with id " + newTransaction.id + ".", { timeout: 1000 });

        /* Update the array in local storage. */
        saveToLocalStorage();
    }

    function updateTransaction(updatedTransaction: Transaction) {
        updatedTransaction.amount = parseFloat(String(updatedTransaction.amount)) || 0;

        /* Find the "original" version of the transaction via its id. */
        const foundIndex = transactions.value.findIndex(x => x.id == updatedTransaction.id);

        // Log output removed for cleaner code
        // console.log("Tracker.updateTransaction(): originalId = " + updatedTransaction.id);
        // console.log("Tracker.updateTransaction(): foundIndex = " + foundIndex);

        if (foundIndex !== -1) {
             /* Replace the transaction at the determined position with the updated transaction. */
            transactions.value[foundIndex] = updatedTransaction;
            toast.success("Succesfully updated the transaction with id " + updatedTransaction.id + ".", { timeout: 1000 });
        } else {
             // Optional: Handle case where transaction wasn't found
            toast.error("Error: Could not find transaction to update.", { timeout: 1000 });
        }

        // Update the array in local storage.
        saveToLocalStorage();
    }

    function deleteTransaction(idOfTransactionToBeDeleted: number): void {

        /* Find the index of the transaction which is to be deleted. */
        const foundIndex = transactions.value.findIndex(x => x.id == idOfTransactionToBeDeleted);

        if (foundIndex === -1) {
            toast.error("The transaction with ID, " + idOfTransactionToBeDeleted + ", does not exist.", { timeout: false });
            return;
        }

        /* Delete the indicated transaction from the array. */
        transactions.value.splice(foundIndex, 1);
        toast.success("Successfully deleted the transaction with ID " + idOfTransactionToBeDeleted + ".", { timeout: 1000 });

        /* Update the array in local storage. */
        saveToLocalStorage();
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