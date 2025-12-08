import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification';
import { Transaction } from '@/types/Transaction.ts';
const toast = useToast();

 export const useTransactionStore = defineStore('storeTransaction', {
    state: (): { transactions: Transaction[] } => ({
        transactions: [],
    }),

    actions: {
        addTransaction(newTransaction: Transaction): void {

            newTransaction.amount = parseFloat(String(newTransaction.amount)) || 0;

            /* Add the new transaction to the array in this store. */
            this.transactions.push(newTransaction)
            toast.success("Successfully added the transaction with id " + newTransaction.id + ".", {timeout: 1000})

            /* Update the array in local storage to reflect the added transaction. */
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
        },
        updateTransaction(updatedTransaction: Transaction) {

            updatedTransaction.amount = parseFloat(String(updatedTransaction.amount)) || 0;

            /* The updated transaction retains the original id. */
            const originalId = updatedTransaction.id
            console.log("Tracker.updateTransaction(): originalId = " + originalId)

            /* Find the "original" version of the transaction via its id. This statement examines the
               array of objects containing the transactions, looking for the one whose id matches the id of
               of the updatedTransaction and returns the POSITION of that transaction within the array. */
            const foundIndex = this.transactions.findIndex(x => x.id == originalId)
            console.log("Tracker.updateTransaction(): foundIndex = " + foundIndex)

            /* Replace the transaction that is at the position just determined with the updated transaction,
               which always has the same id as the original version. */
            this.transactions[foundIndex] = updatedTransaction
            toast.success("Succesfully updated the transaction with id " + originalId + ".", {timeout: 1000})

            //Update the array in local storage to reflect the updated transaction.
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
        },
        deleteTransaction(idOfTransactionToBeDeleted: number): void {

            /* Find the transaction which is to be deleted via its Id. */
            const transactionToBeDeleted = this.transactions.find(e => e.id == idOfTransactionToBeDeleted);

            /* The value of transactionToBeDeleted will be undefined if no transaction exists with the
               specified key. This could happen if another process deleted the transaction just before
               this user tried to do so. If that happens, notify the user. */
            if (typeof transactionToBeDeleted == 'undefined') {
                toast.error("The transaction with ID, " + idOfTransactionToBeDeleted + ", does not exist.", {timeout: false});
                return;
            }

            /* Find the index of the transaction which is to be deleted. */
            const index = this.transactions.indexOf(transactionToBeDeleted);

            /* Delete the indicated transaction from the array. */
            this.transactions.splice(index, 1)
            toast.success("Successfully deleted the transaction with ID " + idOfTransactionToBeDeleted + ".", {timeout: 1000})

            /* Update the array in local storage to reflect the deleted transaction. */
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
        }
    },
    getters: {
        getNewId(): number {

            let newId = 0;
            if (this.transactions.length === 0) {
                newId = 1;
            } else {
                /* Use reduce() to find the transaction with the highest value of Id in the transactions array. */
                const transactionWithHighestId: Transaction = this.transactions.reduce((prev, current) => {
                    return (prev && prev.id > current.id) ? prev : current}); //returns transaction
                const highestId = transactionWithHighestId.id; //get the Id of the transaction that has the highest Id
                newId = highestId + 1; //add 1 to the highest existing Id to get the Id of the new transaction
            }

            return newId;
        },

        getBalance(): number {

            return Number((this.getIncome - this.getExpense).toFixed(2));
        },

        getIncome(): number {

            /* Use filter() to make a new array containing only Income transactions. */
            const incomeTransactions: Transaction[] = this.transactions.filter(transaction => transaction.transactionType === 'Income')

            /* Use reduce() to sum up the Income transactions. */
            const totalIncome = incomeTransactions.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)

            return Number(totalIncome.toFixed(2));
        },

        getExpense(): number {

            /* Use filter() to make a new array containing only Expense transactions. */
            const expenseTransactions: Transaction[] = this.transactions.filter(transaction => transaction.transactionType === 'Expense')

            /* Use reduce() to sum up the Expense transactions. */
            const totalExpense = expenseTransactions.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0)

            return Number(totalExpense.toFixed(2));
        }
    }
})