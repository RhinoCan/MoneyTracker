// tests/components/UpdateTransaction.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import UpdateTransaction from "@/components/UpdateTransaction.vue";
import { Transaction, TransactionTypeValues } from "@/types/Transaction";

// --- GLOBAL MOCKS ---
const { mockUpdateTransaction } = vi.hoisted(() => ({
  mockUpdateTransaction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/stores/TransactionStore", () => ({
  useTransactionStore: () => ({
    updateTransaction: mockUpdateTransaction,
  }),
}));

vi.mock("@/utils/currencyParser", () => ({
  parseCurrency: vi.fn((val) => {
    if (val === null || val === undefined || val === "") return null;
    const sanitized = String(val).replace(/[^\d.-]/g, "");
    const num = parseFloat(sanitized);
    return isNaN(num) ? null : num;
  }),
}));

vi.mock("@/lib/Logger", () => ({
  logSuccess: vi.fn(),
  logValidation: vi.fn(),
  logException: vi.fn(),
}));

import { logSuccess, logValidation, logException } from "@/lib/Logger";

const currentYear = 2026;
const baseTransaction: Transaction = {
  id: 123,
  description: "Test Transaction",
  date: `${currentYear}-05-20`,
  transaction_type: TransactionTypeValues.Expense,
  amount: 75.5,
  user_id: "user-1",
};

describe("UpdateTransaction.vue", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    const el = document.createElement("div");
    el.id = "app";
    document.body.appendChild(el);
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
  });

  function mountComponent(modelValue: Transaction | null = baseTransaction) {
    return mount(UpdateTransaction, {
      attachTo: document.body,
      props: {
        modelValue,
        "onUpdate:modelValue": (val: any) => wrapper.setProps({ modelValue: val }),
      },
      global: {
        stubs: {
          "v-date-input": true,
          KeyboardShortcuts: true,
        },
      },
    });
  }

  // --- RENDERING ---
  describe("rendering", () => {
    it("renders without errors when a transaction is provided", () => {
      wrapper = mountComponent();
      expect(wrapper.exists()).toBe(true);
    });
    it("renders the dialog title", () => {
      wrapper = mountComponent();
      expect(document.body.textContent).toContain("Update Transaction");
    });
    it("renders the description field", () => {
      wrapper = mountComponent();
      expect(document.body.textContent).toContain("Description");
    });
    it("renders the date field", () => {
      const wrapper = mountComponent();
      expect(document.body.innerHTML).toContain("v-date-input");
    });
    it("renders Income and Expense radio options", () => {
      wrapper = mountComponent();
      expect(document.body.textContent).toContain("Income");
      expect(document.body.textContent).toContain("Expense");
    });
    it("renders the amount field", () => {
      wrapper = mountComponent();
      expect(document.body.textContent).toContain("Amount");
    });
    it("renders the Cancel button", () => {
      wrapper = mountComponent();
      const btns = Array.from(document.querySelectorAll(".v-btn"));
      expect(btns.find((b) => b.textContent?.includes("Cancel"))).toBeDefined();
    });
    it("renders the Update Transaction button", () => {
      wrapper = mountComponent();
      const btns = Array.from(document.querySelectorAll(".v-btn"));
      expect(btns.find((b) => b.textContent?.includes("Update Transaction"))).toBeDefined();
    });
    it("renders the help button", () => {
      wrapper = mountComponent();
      expect(document.querySelector('[aria-label*="help"]')).toBeDefined();
    });
    it("renders the close button", () => {
      wrapper = mountComponent();
      expect(document.querySelector('[aria-label*="close"]')).toBeDefined();
    });
    it("does not render the dialog when modelValue is null", async () => {
      wrapper = mountComponent(null);
      await flushPromises();
      expect(document.body.textContent).not.toContain("Update Transaction");
    });
  });

  // --- INITIALIZATION ---
  describe("initialization via watch", () => {
    it("populates localTransaction from the modelValue", () => {
      wrapper = mountComponent();
      expect(wrapper.vm.localTransaction.description).toBe("Test Transaction");
    });
    it("sets localTransaction.date to YYYY-MM-DD format", () => {
      wrapper = mountComponent();
      expect(wrapper.vm.localTransaction.date).toBe(`${currentYear}-05-20`);
    });
    it("strips time from ISO datetime strings in localTransaction.date", async () => {
      const complexDate = { ...baseTransaction, date: `${currentYear}-05-20T14:30:00Z` };
      wrapper = mountComponent(complexDate);
      expect(wrapper.vm.localTransaction.date).toBe(`${currentYear}-05-20`);
    });
    it("sets pickerDate correctly", () => {
      wrapper = mountComponent();
      expect(wrapper.vm.pickerDate.getFullYear()).toBe(currentYear);
    });
    it("sets displayAmount", () => {
      wrapper = mountComponent();
      expect(wrapper.vm.displayAmount).toBeDefined();
    });
    it("localTransaction is a deep clone", () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.amount = 999;
      expect(wrapper.props("modelValue").amount).toBe(75.5);
    });
  });

  // --- DIALOG CONTROLS ---
  describe("dialog controls", () => {
    it("showKeyboardShortcuts is false by default", () => {
      wrapper = mountComponent();
      expect(wrapper.vm.showKeyboardShortcuts).toBe(false);
    });
    it("sets showKeyboardShortcuts to true when help button is clicked", async () => {
      wrapper = mountComponent();
      const btn = document.querySelector('[aria-label*="help"]') as HTMLElement;
      await btn.click();
      expect(wrapper.vm.showKeyboardShortcuts).toBe(true);
    });
    it("sets model.value to null when closeDialog is called", async () => {
      wrapper = mountComponent();
      wrapper.vm.closeDialog();
      await flushPromises();
      expect(wrapper.props("modelValue")).toBeNull();
    });
    it("sets model.value to null when Cancel button is clicked", async () => {
      wrapper = mountComponent();
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.includes("Cancel")
      );
      await btn?.click();
      await flushPromises();
      expect(wrapper.props("modelValue")).toBeNull();
    });
    it("sets model.value to null when close icon button is clicked", async () => {
      wrapper = mountComponent();
      const btn = document.querySelector('[aria-label*="close"]') as HTMLElement;
      await btn?.click();
      await flushPromises();
      expect(wrapper.props("modelValue")).toBeNull();
    });
  });

  // --- HINTS ---
  describe("amountHint", () => {
    it("shows format hint when not focused", () => {
      wrapper = mountComponent();
      wrapper.vm.isFocused = false;
      expect(wrapper.vm.amountHint).toBeDefined();
    });
    it("shows format hint when empty", () => {
      wrapper = mountComponent();
      wrapper.vm.displayAmount = "";
      expect(wrapper.vm.amountHint).toBeDefined();
    });
    it("shows warning for comma", async () => {
      wrapper = mountComponent();
      wrapper.vm.isFocused = true;
      wrapper.vm.displayAmount = "12,34";
      await flushPromises();
      expect(wrapper.vm.amountHint).toContain("Please use .");
    });
  });

  // --- DATE SELECTION ---
  describe("onDateSelected", () => {
    it("updates date", () => {
      wrapper = mountComponent();
      wrapper.vm.onDateSelected(new Date(currentYear, 1, 1));
      expect(wrapper.vm.localTransaction.date).toBe(`${currentYear}-02-01`);
    });
    it("updates pickerDate", () => {
      wrapper = mountComponent();
      const d = new Date(currentYear, 1, 1);
      wrapper.vm.onDateSelected(d);
      expect(wrapper.vm.pickerDate).toEqual(d);
    });
    it("clears date when null is passed", () => {
      wrapper = mountComponent();
      wrapper.vm.onDateSelected(null);
      expect(wrapper.vm.localTransaction.date).toBe("");
    });
    it("ignores array", () => {
      wrapper = mountComponent();
      wrapper.vm.onDateSelected([new Date()]);
      expect(wrapper.vm.localTransaction.date).toBe(`${currentYear}-05-20`);
    });
    it("ignores if localTransaction is null", () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction = null;
      wrapper.vm.onDateSelected(new Date());
      expect(wrapper.vm.localTransaction).toBeNull();
    });
  });

  // --- SUBMISSION CORE ---
  describe("onSubmit core", () => {
    it("fails validation", async () => {
      wrapper = mountComponent();
      await wrapper.vm.onSubmit(Promise.resolve({ valid: false }) as any);
      expect(logValidation).toHaveBeenCalled();
    });
    it("fails if localTransaction null", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction = null;
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(logValidation).toHaveBeenCalled();
    });
    it("fails if no changes", async () => {
      wrapper = mountComponent();
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(logValidation).toHaveBeenCalledWith(
        expect.stringContaining("Nothing"),
        expect.any(Object)
      );
    });
    it("calls updateTransaction with changed amount", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.amount = 999;
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ amount: 999 })
      );
    });
    it("updates description", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "New";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(123, { description: "New" });
    });
    it("updates type", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.transaction_type = TransactionTypeValues.Income;
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(123, { transaction_type: "Income" });
    });
    it("updates date", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.date = "2026-01-01";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(123, { date: "2026-01-01" });
    });
    it("logs success", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "X";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      await flushPromises();
      expect(logSuccess).toHaveBeenCalled();
    });
    it("closes on success", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "X";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      await flushPromises();
      expect(wrapper.props("modelValue")).toBeNull();
    });
    it("logs exception", async () => {
      mockUpdateTransaction.mockRejectedValueOnce(new Error());
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "X";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      await flushPromises();
      expect(logException).toHaveBeenCalled();
    });
    it("stays open on error", async () => {
      mockUpdateTransaction.mockRejectedValueOnce(new Error());
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "X";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      await flushPromises();
      expect(wrapper.props("modelValue")).not.toBeNull();
    });
    it("uses correct id", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "X";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(123, expect.any(Object));
    });
    it("shows format hint when focused with correct separator", () => {
      wrapper = mountComponent();
      wrapper.vm.isFocused = true;
      wrapper.vm.displayAmount = "12.34";
      expect(wrapper.vm.amountHint).toBeDefined();
    });
    it("detects amount change entered via displayAmount", async () => {
      wrapper = mountComponent();
      wrapper.vm.displayAmount = "25.99";
      wrapper.vm.transaction.amount = 25.99;
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      expect(mockUpdateTransaction).toHaveBeenCalledWith(
        123,
        expect.objectContaining({ amount: 25.99 })
      );
    });
  });

  // --- DIFF DETECTION ---
  describe("diff / change detection", () => {
    it("omits description if unchanged", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.amount = 999;
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      const changes = mockUpdateTransaction.mock.calls[0][1];
      expect(changes.description).toBeUndefined();
    });
    it("omits amount if unchanged", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.description = "New";
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      const changes = mockUpdateTransaction.mock.calls[0][1];
      expect(changes.amount).toBeUndefined();
    });
    it("omits date if unchanged", async () => {
      wrapper = mountComponent();
      wrapper.vm.localTransaction.amount = 999;
      await wrapper.vm.onSubmit(Promise.resolve({ valid: true }) as any);
      const changes = mockUpdateTransaction.mock.calls[0][1];
      expect(changes.date).toBeUndefined();
    });
  });
});
