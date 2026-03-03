// tests/components/AccountSummary.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { useTransactionStore } from "@/stores/TransactionStore";
import AccountSummary from "@/components/AccountSummary.vue";

vi.mock("@/components/Amount.vue", () => ({
  default: {
    name: "Amount",
    props: ["amount", "type"],
    template: '<span class="mock-amount" :data-amount="amount" :data-type="type">{{ amount }}</span>',
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

describe("AccountSummary.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("empty state (no transactions)", () => {
    it("renders the card title", () => {
      const wrapper = mount(AccountSummary);
      expect(wrapper.text()).toContain("Account Summary");
    });

    it("shows an info alert when there are no transactions", () => {
      const wrapper = mount(AccountSummary);
      expect(wrapper.find(".v-alert").exists()).toBe(true);
    });

    it("does not show the summary table when there are no transactions", () => {
      const wrapper = mount(AccountSummary);
      expect(wrapper.find(".summary-table").exists()).toBe(false);
    });
  });

  describe("populated state (with transactions)", () => {
    beforeEach(() => {
      const store = useTransactionStore();
      store.transactions = [
        { id: "1", user_id: "u1", amount: 1000, transaction_type: "Income", description: "Salary", date: "2025-06-01", created_at: "2025-06-01T00:00:00Z" },
        { id: "2", user_id: "u1", amount: 400, transaction_type: "Expense", description: "Rent", date: "2025-06-02", created_at: "2025-06-02T00:00:00Z" },
      ];
    });

    it("shows the summary table when transactions exist", () => {
      const wrapper = mount(AccountSummary);
      expect(wrapper.find(".summary-table").exists()).toBe(true);
    });

    it("does not show the alert when transactions exist", () => {
      const wrapper = mount(AccountSummary);
      expect(wrapper.find(".v-alert").exists()).toBe(false);
    });

    it("renders an Amount component for income", () => {
      const wrapper = mount(AccountSummary);
      const amounts = wrapper.findAll(".mock-amount");
      const incomeAmount = amounts.find((a) => a.attributes("data-type") === "Income");
      expect(incomeAmount).toBeTruthy();
      expect(incomeAmount!.attributes("data-amount")).toBe("1000");
    });

    it("renders an Amount component for expense", () => {
      const wrapper = mount(AccountSummary);
      const amounts = wrapper.findAll(".mock-amount");
      const expenseAmount = amounts.find((a) => a.attributes("data-type") === "Expense");
      expect(expenseAmount).toBeTruthy();
      expect(expenseAmount!.attributes("data-amount")).toBe("400");
    });

    it("renders an Amount component for balance", () => {
      const wrapper = mount(AccountSummary);
      const amounts = wrapper.findAll(".mock-amount");
      const balanceAmount = amounts.find((a) => a.attributes("data-type") === "Balance");
      expect(balanceAmount).toBeTruthy();
      expect(balanceAmount!.attributes("data-amount")).toBe("600");
    });

    it("renders income, expense, and balance labels", () => {
      const wrapper = mount(AccountSummary);
      const text = wrapper.text();
      expect(text).toContain("Income");
      expect(text).toContain("Expense");
      expect(text).toContain("Balance");
    });
  });
});
