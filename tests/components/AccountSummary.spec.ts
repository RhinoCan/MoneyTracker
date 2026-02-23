import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import AccountSummary from "@/components/AccountSummary.vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import Money from "@/components/Money.vue";

describe("AccountSummary.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders an alert when there are no transactions", () => {
    const store = useTransactionStore();
    store.transactions = []; // Ensure empty state

    const wrapper = mount(AccountSummary, {
      global: {
        stubs: { Money: true },
      },
    });

    expect(wrapper.find(".v-alert").exists()).toBe(true);
    expect(wrapper.text()).toContain("You won't see anything but zeroes here");
    expect(wrapper.find("table").exists()).toBe(false);
  });

  it("renders the summary table when transactions exist", () => {
    const store = useTransactionStore();
    // Add dummy data to trigger the v-else
    store.transactions = [
      { id: 1, description: "Test", transactionType: "Income", amount: 100, date: "2023-01-01" },
    ];

    // Setup mock getters
    // Note: In real Pinia, getters are computed from state,
    // but we can just set the state and let the store work.
    store.transactions = [
      { id: 1, description: "Salary", transactionType: "Income", amount: 1000, date: "2023-01-01" },
      { id: 2, description: "Rent", transactionType: "Expense", amount: 400, date: "2023-01-01" },
    ];

    const wrapper = mount(AccountSummary, {
      global: {
        components: { Money }, // Use real Money component to verify props
      },
    });

    expect(wrapper.find(".v-alert").exists()).toBe(false);
    expect(wrapper.find("table").exists()).toBe(true);

    // Find all Money components
    const moneyComponents = wrapper.findAllComponents(Money);
    expect(moneyComponents).toHaveLength(3);

    // Verify props passed to Money components
    // 1st: Income (1000)
    expect(moneyComponents[0].props("amount")).toBe(1000);
    expect(moneyComponents[0].props("type")).toBe("Income");

    // 2nd: Expense (400)
    expect(moneyComponents[1].props("amount")).toBe(400);
    expect(moneyComponents[1].props("type")).toBe("Expense");

    // 3rd: Balance (600)
    expect(moneyComponents[2].props("amount")).toBe(600);
    expect(moneyComponents[2].props("type")).toBe("Balance");
  });
});
