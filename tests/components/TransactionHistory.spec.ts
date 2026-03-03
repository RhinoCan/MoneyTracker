// tests/components/TransactionHistory.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { useTransactionStore } from "@/stores/TransactionStore";
import TransactionHistory from "@/components/TransactionHistory.vue";

// -------------------------------------------------------------------------
// Hoisted mocks
// -------------------------------------------------------------------------
const { mockFormatToMediumDate } = vi.hoisted(() => ({
  mockFormatToMediumDate: vi.fn((date: string) => `fmt:${date}`),
}));

vi.mock("@/composables/useDateFormatter", () => ({
  useDateFormatter: () => ({
    formatToMediumDate: mockFormatToMediumDate,
    formatToIsoDateOnly: vi.fn(),
  }),
}));

vi.mock("@/components/Amount.vue", () => ({
  default: {
    name: "Amount",
    props: ["amount", "type"],
    template: '<span class="mock-amount" :data-amount="amount">{{ amount }}</span>',
  },
}));

vi.mock("@/components/DeleteTransaction.vue", () => ({
  default: { name: "DeleteTransaction", props: ["modelValue"], template: "<div class='mock-delete' />" },
}));

vi.mock("@/components/UpdateTransaction.vue", () => ({
  default: { name: "UpdateTransaction", props: ["modelValue"], template: "<div class='mock-update' />" },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

const sampleTransactions = [
  { id: 1, user_id: "u1", amount: 1000, transaction_type: "Income" as const, description: "Salary", date: "2025-06-01", created_at: "2025-06-01T00:00:00Z" },
  { id: 2, user_id: "u1", amount: 400, transaction_type: "Expense" as const, description: "Rent", date: "2025-06-02", created_at: "2025-06-02T00:00:00Z" },
];

describe("TransactionHistory.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockFormatToMediumDate.mockImplementation((date: string) => `fmt:${date}`);
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mount(TransactionHistory);
      expect(wrapper.exists()).toBe(true);
    });

    it("renders the card title", () => {
      const wrapper = mount(TransactionHistory);
      expect(wrapper.text()).toContain("Transaction History");
    });

    it("renders the search field", () => {
      const wrapper = mount(TransactionHistory);
      expect(wrapper.find(".v-text-field").exists()).toBe(true);
    });

    it("renders the data table", () => {
      const wrapper = mount(TransactionHistory);
      expect(wrapper.find(".v-data-table").exists()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  describe("empty state", () => {
    it("shows no-data content when there are no transactions", () => {
      // TransactionStore starts empty by default with createPinia
      const wrapper = mount(TransactionHistory);
      // The no-data slot contains an alert
      expect(wrapper.find(".v-alert").exists()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Populated state
  // -------------------------------------------------------------------------
  describe("populated state", () => {
    beforeEach(() => {
      const store = useTransactionStore();
      store.transactions = sampleTransactions;
    });

    it("renders a row for each transaction", () => {
      const wrapper = mount(TransactionHistory);
      const rows = wrapper.findAll(".transaction-row");
      expect(rows.length).toBe(2);
    });

    it("renders the description in each row", () => {
      const wrapper = mount(TransactionHistory);
      const text = wrapper.text();
      expect(text).toContain("Salary");
      expect(text).toContain("Rent");
    });

    it("renders formatted dates", () => {
      const wrapper = mount(TransactionHistory);
      expect(wrapper.text()).toContain("fmt:2025-06-01");
    });

    it("renders Amount components for each transaction", () => {
      const wrapper = mount(TransactionHistory);
      const amounts = wrapper.findAll(".mock-amount");
      expect(amounts.length).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Row actions
  // -------------------------------------------------------------------------
  describe("row actions", () => {
    beforeEach(() => {
      const store = useTransactionStore();
      store.transactions = sampleTransactions;
    });

    it("sets transactionToUpdate when edit button is clicked", async () => {
      const wrapper = mount(TransactionHistory);
      const editBtn = wrapper.findAll(".v-btn").find((b) =>
        b.attributes("aria-label")?.includes("Update") || b.attributes("aria-label")?.includes("Edit")
      );
      await editBtn!.trigger("click");
      expect((wrapper.vm as any).transactionToUpdate).not.toBeNull();
    });

    it("sets transactionToDelete when delete button is clicked", async () => {
      const wrapper = mount(TransactionHistory);
      const deleteBtn = wrapper.findAll(".v-btn").find((b) =>
        b.attributes("aria-label")?.includes("Delete")
      );
      await deleteBtn!.trigger("click");
      expect((wrapper.vm as any).transactionToDelete).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  describe("pagination", () => {
    it("starts on page 1", () => {
      const wrapper = mount(TransactionHistory);
      expect((wrapper.vm as any).page).toBe(1);
    });

    it("defaults to 10 items per page", () => {
      const wrapper = mount(TransactionHistory);
      expect((wrapper.vm as any).itemsPerPage).toBe(10);
    });

    it("pageStatusText shows 0 when no transactions", () => {
      const wrapper = mount(TransactionHistory);
      const vm = wrapper.vm as any;
      expect(vm.pageStatusText).toContain("0");
    });
  });
});
