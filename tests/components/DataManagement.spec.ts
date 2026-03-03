// tests/components/DataManagement.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import { useTransactionStore } from "@/stores/TransactionStore";
import { useSettingsStore } from "@/stores/SettingsStore";
import DataManagement from "@/components/DataManagement.vue";

// -------------------------------------------------------------------------
// Hoisted mocks
// -------------------------------------------------------------------------
const {
  mockDeleteAllTransactions,
  mockClearFromDb,
  mockRestoreDefaults,
  mockSaveToDb,
} = vi.hoisted(() => ({
  mockDeleteAllTransactions: vi.fn().mockResolvedValue(undefined),
  mockClearFromDb: vi.fn().mockResolvedValue(undefined),
  mockRestoreDefaults: vi.fn(),
  mockSaveToDb: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/stores/TransactionStore", () => ({
  useTransactionStore: vi.fn(),
}));

vi.mock("@/stores/SettingsStore", () => ({
  useSettingsStore: vi.fn(),
}));

import { useTransactionStore as _useTransactionStore } from "@/stores/TransactionStore";
import { useSettingsStore as _useSettingsStore } from "@/stores/SettingsStore";

function mountComponent(transactionOverrides = {}) {
  (_useTransactionStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    transactions: [],
    deleteAllTransactions: mockDeleteAllTransactions,
    ...transactionOverrides,
  });
  (_useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    restoreDefaults: mockRestoreDefaults,
    saveToDb: mockSaveToDb,
    clearFromDb: mockClearFromDb,
  });
  return mount(DataManagement);
}

describe("DataManagement.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Stub window.confirm — default to true (user confirms)
    vi.stubGlobal("confirm", vi.fn(() => true));
    // Stub URL.createObjectURL for export tests
    vi.stubGlobal("URL", { createObjectURL: vi.fn(() => "blob:mock") });
    // Stub window.location.reload
    vi.stubGlobal("location", { reload: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mountComponent();
      expect(wrapper.exists()).toBe(true);
    });

    it("renders the title", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Data Management");
    });

    it("renders the Export section", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Export");
    });

    it("renders the Danger Zone section", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Danger Zone");
    });

    it("disables the Export button when there are no transactions", () => {
      const wrapper = mountComponent({ transactions: [] });
      const exportBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Export"));
      expect(exportBtn!.attributes("disabled")).toBeDefined();
    });

    it("enables the Export button when transactions exist", () => {
      const wrapper = mountComponent({
        transactions: [{ id: "1", date: "2025-06-01", description: "Test", transaction_type: "Income", amount: 100 }],
      });
      const exportBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Export"));
      expect(exportBtn!.attributes("disabled")).toBeUndefined();
    });

    it("renders Close button", () => {
      const wrapper = mountComponent();
      expect(wrapper.text()).toContain("Close");
    });
  });

  // -------------------------------------------------------------------------
  // Close emit
  // -------------------------------------------------------------------------
  describe("close", () => {
    it("emits close when Close button is clicked", async () => {
      const wrapper = mountComponent();
      const closeBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Close"));
      await closeBtn!.trigger("click");
      expect(wrapper.emitted("close")).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // handleDeleteAllTransactions
  // -------------------------------------------------------------------------
  describe("handleDeleteAllTransactions", () => {
    it("calls deleteAllTransactions when user confirms", async () => {
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllTransactions();
      expect(mockDeleteAllTransactions).toHaveBeenCalled();
    });

    it("emits close after deleting transactions", async () => {
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllTransactions();
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("does not call deleteAllTransactions when user cancels", async () => {
      vi.stubGlobal("confirm", vi.fn(() => false));
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllTransactions();
      expect(mockDeleteAllTransactions).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleDeleteAllSettings
  // -------------------------------------------------------------------------
  describe("handleDeleteAllSettings", () => {
    it("calls restoreDefaults and saveToDb when user confirms", async () => {
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllSettings();
      expect(mockRestoreDefaults).toHaveBeenCalled();
      expect(mockSaveToDb).toHaveBeenCalled();
    });

    it("emits close after restoring settings", async () => {
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllSettings();
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("does not call restoreDefaults when user cancels", async () => {
      vi.stubGlobal("confirm", vi.fn(() => false));
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllSettings();
      expect(mockRestoreDefaults).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleDeleteAllData
  // -------------------------------------------------------------------------
  describe("handleDeleteAllData", () => {
    it("calls deleteAllTransactions and clearFromDb when user confirms", async () => {
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllData();
      expect(mockDeleteAllTransactions).toHaveBeenCalled();
      expect(mockClearFromDb).toHaveBeenCalled();
    });

    it("calls window.location.reload after wiping all data", async () => {
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllData();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it("does not call deleteAllTransactions when user cancels", async () => {
      vi.stubGlobal("confirm", vi.fn(() => false));
      const wrapper = mountComponent();
      await (wrapper.vm as any).handleDeleteAllData();
      expect(mockDeleteAllTransactions).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleExport
  // -------------------------------------------------------------------------
  describe("handleExport", () => {
    it("does not create a blob when there are no transactions", async () => {
      const wrapper = mountComponent({ transactions: [] });
      // Button is disabled, call handleExport directly
      (wrapper.vm as any).handleExport();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    it("creates a CSV blob when transactions exist", async () => {
      const wrapper = mountComponent({
        transactions: [
          { id: 1, date: "2025-06-01", description: "Salary", transaction_type: "Income", amount: 1000 },
        ],
      });
      (wrapper.vm as any).handleExport();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it("escapes double quotes in description", async () => {
      let capturedContent = "";
      // Capture what's passed into the Blob constructor
      const OriginalBlob = globalThis.Blob;
      vi.stubGlobal("Blob", class extends OriginalBlob {
        constructor(parts: BlobPart[], options?: BlobPropertyBag) {
          super(parts, options);
          capturedContent = (parts as string[]).join("");
        }
      });

      const wrapper = mountComponent({
        transactions: [
          { id: 1, date: "2025-06-01", description: 'He said "hello"', transaction_type: "Income", amount: 100 },
        ],
      });
      (wrapper.vm as any).handleExport();

      expect(capturedContent).toContain('He said ""hello""');
    });
  });
});
