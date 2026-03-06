// tests/components/AddTransaction.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import AddTransaction from "@/components/AddTransaction.vue";

// -------------------------------------------------------------------------
// Hoisted mocks
// -------------------------------------------------------------------------
const { mockAddTransaction } = vi.hoisted(() => ({
  mockAddTransaction: vi.fn().mockResolvedValue({ id: 1 }),
}));

vi.mock("@/stores/TransactionStore", () => ({
  useTransactionStore: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

import { useTransactionStore as _useTransactionStore } from "@/stores/TransactionStore";
import { logSuccess, logValidation, logException } from "@/lib/Logger";

function mountComponent() {
  (_useTransactionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    addTransaction: mockAddTransaction,
  });
  return mount(AddTransaction);
}

describe("AddTransaction.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mountComponent();
      expect(wrapper.exists()).toBe(true);
    });

    it("renders the card title", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Add New Transaction");
    });

    it("renders the description field", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Description");
    });

    it("renders the date field", () => {
      const wrapper = mountComponent();
      expect(wrapper.html()).toContain("v-date-input");
    });

    it("renders the transaction type radio group", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Income");
      expect(wrapper.text()).toContain("Expense");
    });

    it("renders the amount field", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Amount");
    });

    it("renders the Reset button", () => {
      const wrapper = mountComponent();
      const btn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Reset"));
      expect(btn).toBeDefined();
    });

    it("renders the Add Transaction button", () => {
      const wrapper = mountComponent();
      const btn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Add"));
      expect(btn).toBeDefined();
    });

    it("renders the help button", () => {
      const wrapper = mountComponent();
      const helpBtn = wrapper
        .findAll(".v-btn")
        .find((b) => b.attributes("aria-label")?.toLowerCase().includes("help"));
      expect(helpBtn).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard shortcuts dialog
  // -------------------------------------------------------------------------
  describe("keyboard shortcuts dialog", () => {
    it("showKeyboardShortcuts is false by default", () => {
      const wrapper = mountComponent();
      expect((wrapper.vm as any).showKeyboardShortcuts).toBe(false);
    });

    it("sets showKeyboardShortcuts to true when help button is clicked", async () => {
      const wrapper = mountComponent();
      const helpBtn = wrapper
        .findAll(".v-btn")
        .find((b) => b.attributes("aria-label")?.toLowerCase().includes("help"));
      await helpBtn!.trigger("click");
      expect((wrapper.vm as any).showKeyboardShortcuts).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // pickerDate
  // -------------------------------------------------------------------------
  describe("pickerDate", () => {
    it("is initialized to today's date", () => {
      const wrapper = mountComponent();
      const today = new Date();
      expect((wrapper.vm as any).pickerDate.getFullYear()).toBe(today.getFullYear());
      expect((wrapper.vm as any).pickerDate.getMonth()).toBe(today.getMonth());
      expect((wrapper.vm as any).pickerDate.getDate()).toBe(today.getDate());
    });
  });

  // -------------------------------------------------------------------------
  // amountHint computed
  // -------------------------------------------------------------------------
  describe("amountHint", () => {
    it("shows format hint when not focused", () => {
      const wrapper = mountComponent();
      const hint = (wrapper.vm as any).amountHint;
      expect(hint).toContain("1,234.56");
    });

    it("shows format hint when focused but displayAmount is empty", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).isFocused = true;
      (wrapper.vm as any).displayAmount = "";
      await wrapper.vm.$nextTick();
      const hint = (wrapper.vm as any).amountHint;
      expect(hint).toContain("1,234.56");
    });

    it("shows wrong separator warning when focused with incorrect separator", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).isFocused = true;
      (wrapper.vm as any).displayAmount = "1,23";
      await wrapper.vm.$nextTick();
      const hint = (wrapper.vm as any).amountHint;
      expect(hint).toContain(".");
    });

    it("shows format hint when focused with correct separator", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).isFocused = true;
      (wrapper.vm as any).displayAmount = "1234.56";
      await wrapper.vm.$nextTick();
      const hint = (wrapper.vm as any).amountHint;
      expect(hint).toContain("1,234.56");
    });
  });

  // -------------------------------------------------------------------------
  // onDateSelected
  // -------------------------------------------------------------------------
  describe("onDateSelected", () => {
    it("updates transaction.date when a valid date is selected", async () => {
      const wrapper = mountComponent();
      const date = new Date(2025, 5, 15);
      (wrapper.vm as any).onDateSelected(date);
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).transaction.date).toBe("2025-06-15");
    });

    it("updates pickerDate when a valid date is selected", async () => {
      const wrapper = mountComponent();
      const date = new Date(2025, 5, 15);
      (wrapper.vm as any).onDateSelected(date);
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).pickerDate).toEqual(date);
    });

    it("clears transaction.date when null is passed", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).onDateSelected(null);
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).transaction.date).toBe("");
    });

    it("does nothing when an array is passed", async () => {
      const wrapper = mountComponent();
      const originalDate = (wrapper.vm as any).transaction.date;
      (wrapper.vm as any).onDateSelected([new Date()]);
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).transaction.date).toBe(originalDate);
    });
  });

  // -------------------------------------------------------------------------
  // resetForm
  // -------------------------------------------------------------------------
  describe("resetForm", () => {
    it("resets description to empty string", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.description = "Test";
      (wrapper.vm as any).resetForm();
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).transaction.description).toBe("");
    });

    it("resets amount to 0", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.amount = 500;
      (wrapper.vm as any).resetForm();
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).transaction.amount).toBe(0);
    });

    it("resets displayAmount to empty string", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).displayAmount = "500.00";
      (wrapper.vm as any).resetForm();
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).displayAmount).toBe("");
    });

    it("resets transaction_type to Expense", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.transaction_type = "Income";
      (wrapper.vm as any).resetForm();
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).transaction.transaction_type).toBe("Expense");
    });

    it("resets dateError to null", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).dateError = "some error";
      (wrapper.vm as any).resetForm();
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).dateError).toBeNull();
    });

    it("resets date to today in ISO format", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.date = "2020-01-01";
      (wrapper.vm as any).resetForm();
      await wrapper.vm.$nextTick();
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      expect((wrapper.vm as any).transaction.date).toBe(expected);
    });
  });

  // -------------------------------------------------------------------------
  // onSubmit
  // -------------------------------------------------------------------------
  describe("onSubmit", () => {
    it("calls logValidation and returns early when form is invalid", async () => {
      const wrapper = mountComponent();
      const submitEvent = Promise.resolve({ valid: false }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      expect(logValidation).toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it("calls logException and returns early when amount is 0", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.amount = 0;
      const submitEvent = Promise.resolve({ valid: true }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      expect(logException).toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it("calls logException and returns early when amount is negative", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.amount = -100;
      const submitEvent = Promise.resolve({ valid: true }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      expect(logException).toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });

    it("calls addTransaction with correct payload on valid submit", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).displayAmount = "1000";
      (wrapper.vm as any).transaction.description = "Salary";
      (wrapper.vm as any).transaction.date = "2025-06-15";
      (wrapper.vm as any).transaction.transaction_type = "Income";
      const submitEvent = Promise.resolve({ valid: true }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      await flushPromises();
      expect(mockAddTransaction).toHaveBeenCalledWith({
        description: "Salary",
        date: "2025-06-15",
        transaction_type: "Income",
        amount: 1000,
      });
    });

    it("calls logSuccess after successful add", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).displayAmount = "500";
      (wrapper.vm as any).transaction.description = "Test";
      (wrapper.vm as any).transaction.date = "2025-06-15";
      (wrapper.vm as any).transaction.transaction_type = "Income";
      const submitEvent = Promise.resolve({ valid: true }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      await flushPromises();
      expect(logSuccess).toHaveBeenCalled();
    });

    it("resets the form after successful add", async () => {
      const wrapper = mountComponent();
      (wrapper.vm as any).displayAmount = "500";
      (wrapper.vm as any).transaction.description = "Salary";
      (wrapper.vm as any).transaction.transaction_type = "Income";
      (wrapper.vm as any).transaction.date = "2025-06-15";
      const submitEvent = Promise.resolve({ valid: true }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      await flushPromises();
      expect((wrapper.vm as any).transaction.description).toBe("");
      expect((wrapper.vm as any).transaction.amount).toBe(0);
    });

    it("calls logException when addTransaction throws", async () => {
      mockAddTransaction.mockRejectedValueOnce(new Error("DB error"));
      const wrapper = mountComponent();
      (wrapper.vm as any).transaction.amount = 500;
      (wrapper.vm as any).transaction.description = "Test";
      (wrapper.vm as any).transaction.date = "2025-06-15";
      (wrapper.vm as any).transaction.transaction_type = "Income";
      const submitEvent = Promise.resolve({ valid: true }) as any;
      await (wrapper.vm as any).onSubmit(submitEvent);
      await flushPromises();
      expect(logException).toHaveBeenCalled();
    });
  });
});
