// tests/components/DeleteTransaction.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import type { Transaction } from "@/types/Transaction";
import DeleteTransaction from "@/components/DeleteTransaction.vue";

// -------------------------------------------------------------------------
// Hoisted mocks
// -------------------------------------------------------------------------
const { mockDeleteTransaction, mockFormatToMediumDate } = vi.hoisted(() => ({
  mockDeleteTransaction: vi.fn().mockResolvedValue(undefined),
  mockFormatToMediumDate: vi.fn((date: string) => `formatted:${date}`),
}));

vi.mock("@/stores/TransactionStore", () => ({
  useTransactionStore: () => ({
    transactions: [],
    deleteTransaction: mockDeleteTransaction,
  }),
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
    template: '<span class="mock-amount">{{ amount }}</span>',
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "deleteDialog.title": "Delete Transaction",
        "deleteDialog.confirmBtn": "Delete",
        "common.cancel": "Cancel",
        "common.close": "Close",
        "common.description": "Description",
        "common.date": "Date",
        "common.type": "Type",
        "common.amount": "Amount",
        "common.Expense": "Expense",
      };
      return map[key] ?? key;
    },
  }),
}));

// -------------------------------------------------------------------------
// Test data
// -------------------------------------------------------------------------
const sampleTransaction: Transaction = {
  id: 1,
  user_id: "u1",
  amount: 250,
  transaction_type: "Expense",
  description: "Grocery shopping",
  date: "2025-06-15",
  created_at: "2025-06-15T00:00:00Z",
};

// -------------------------------------------------------------------------
// Mount helper
// -------------------------------------------------------------------------
function mountComponent(modelValue: Transaction | null, onUpdate?: any) {
  return mount(DeleteTransaction, {
    props: {
      modelValue,
      "onUpdate:modelValue": onUpdate,
    },
    global: {
      stubs: {
        VDialog: {
          template: "<div><slot /></div>",
        },
      },
    },
  });
}

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------
describe("DeleteTransaction.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Dialog visibility
  // -----------------------------------------------------------------------
  describe("dialog visibility", () => {
    it("does not render the card when modelValue is null", () => {
      const wrapper = mountComponent(null);
      expect(wrapper.find(".v-card").exists()).toBe(false);
    });

    it("renders the card when a transaction is provided", () => {
      const wrapper = mountComponent(sampleTransaction);
      expect(wrapper.find(".v-card").exists()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Content rendering
  // -----------------------------------------------------------------------
  describe("content rendering", () => {
    it("renders transaction details", () => {
      const wrapper = mountComponent(sampleTransaction);

      expect(wrapper.text()).toContain("Grocery shopping");
      expect(wrapper.text()).toContain("formatted:2025-06-15");
      expect(wrapper.find(".mock-amount").text()).toBe("250");
    });

    it("renders Cancel and Delete buttons", () => {
      const wrapper = mountComponent(sampleTransaction);
      expect(wrapper.text()).toContain("Cancel");
      expect(wrapper.text()).toContain("Delete");
    });
  });

  // -----------------------------------------------------------------------
  // deleteTransaction
  // -----------------------------------------------------------------------
  describe("deleteTransaction", () => {
    it("calls store delete with correct id", async () => {
      const wrapper = mountComponent(sampleTransaction);

      const deleteBtn = wrapper.findAll(".v-btn")
        .find(b => b.text().includes("Delete"));

      await deleteBtn!.trigger("click");

      expect(mockDeleteTransaction).toHaveBeenCalledWith(1);
    });

    it("emits null after successful delete", async () => {
      const onUpdate = vi.fn();
      const wrapper = mountComponent(sampleTransaction, onUpdate);

      const deleteBtn = wrapper.findAll(".v-btn")
        .find(b => b.text().includes("Delete"));

      await deleteBtn!.trigger("click");
      await wrapper.vm.$nextTick();

      expect(onUpdate).toHaveBeenCalledWith(null);
    });
  });

  // -----------------------------------------------------------------------
  // Cancel
  // -----------------------------------------------------------------------
  describe("cancel", () => {
    it("emits null when Cancel is clicked", async () => {
      const onUpdate = vi.fn();
      const wrapper = mountComponent(sampleTransaction, onUpdate);

      const cancelBtn = wrapper.findAll(".v-btn")
        .find(b => b.text().includes("Cancel"));

      await cancelBtn!.trigger("click");

      expect(onUpdate).toHaveBeenCalledWith(null);
    });
  });
});
