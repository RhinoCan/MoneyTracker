import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "@/App.vue";
import { useTransactionStore } from "@/stores/TransactionStore";

describe("App.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // Reset and define the localStorage mock
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  it("loads transactions from localStorage on mount", async () => {
    const mockTransactions = [
      { id: 1, description: 'Test', amount: 10, date: '2025-01-01', transactionType: 'Expense' }
    ];

    // Force the getItem to return our stringified data
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockTransactions));

    const wrapper = mount(App, {
      global: {
        stubs: {
          VApp: { template: '<div><slot /></div>' },
          VMain: { template: '<div><slot /></div>' },
          VContainer: { template: '<div><slot /></div>' },
          TrackerHeader: true,
          AccountSummary: true,
          AddTransaction: true,
          TransactionHistory: true,
          TrackerAbout: true,
          SettingsDialog: true,
          KeyboardShortcutsDialog: true,
        },
      },
    });

    const store = useTransactionStore();

    // This triggers the 'if (savedTransactions !== null)' branch
    expect(localStorage.getItem).toHaveBeenCalledWith('transactions');
    expect(store.transactions.length).toBe(1);
    expect(store.transactions[0].description).toBe('Test');
    expect(wrapper.exists()).toBe(true);
  });
});