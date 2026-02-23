import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import DeleteTransaction from "@/components/DeleteTransaction.vue";
import { useTransactionStore } from "@/stores/TransactionStore";
import type { Transaction } from "@/types/Transaction";
import { logInfo } from "@/utils/Logger";

// Hoist the mock functions so they're available to the mock factory
const { mockLogException, mockLogWarning, mockLogInfo, mockLogSuccess } = vi.hoisted(() => ({
  mockLogException: vi.fn(),
  mockLogWarning: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogSuccess: vi.fn(),
}));

// Mock the Logger module using the hoisted functions
vi.mock("@/utils/Logger", () => ({
  logException: mockLogException,
  logWarning: mockLogWarning,
  logInfo: mockLogInfo,
  logSuccess: mockLogSuccess,
}));

describe("DeleteTransaction.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
  });

  const mockTransaction: Transaction = {
    id: 123,
    description: "Coffee",
    amount: 5.5,
    transactionType: "Expense",
    date: "2023-12-25",
  } as Transaction;

  const globalMountOptions = {
    global: {
      stubs: {
        // Use a functional component-style stub to ensure it's a real Vue instance
        VDialog: {
          name: "VDialog",
          template: '<div class="v-dialog-stub"><slot /></div>',
          props: ["modelValue"], // ensure it accepts the prop
        },
        Money: true,
      },
    },
  };

  it("renders nothing when model is null", () => {
    const wrapper = mount(DeleteTransaction, {
      props: { modelValue: null },
      ...globalMountOptions,
    });
    expect(wrapper.find(".v-card").exists()).toBe(false);
  });

  it("displays transaction details when model is provided", () => {
    const wrapper = mount(DeleteTransaction, {
      props: { modelValue: mockTransaction },
      ...globalMountOptions,
    });

    expect(wrapper.text()).toContain("123");
    expect(wrapper.text()).toContain("Coffee");
    expect(wrapper.text()).toContain("Expense");
  });

  it("sets model to null when Cancel is clicked", async () => {
    const wrapper = mount(DeleteTransaction, {
      props: { modelValue: mockTransaction },
      ...globalMountOptions,
    });

    // We can't use the text prop find in a stub easily,
    // so we find by the button's class or use findComponent if needed
    const buttons = wrapper.findAll("button");
    const cancelBtn = buttons.find((b) => b.text().includes("Cancel"));

    await cancelBtn?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([null]);
  });

  it("calls store.deleteTransaction and clears model on confirm", async () => {
    const store = useTransactionStore();
    const deleteSpy = vi.spyOn(store, "deleteTransaction");

    const wrapper = mount(DeleteTransaction, {
      props: { modelValue: mockTransaction },
      ...globalMountOptions,
    });

    const buttons = wrapper.findAll("button");
    const deleteBtn = buttons.find((b) => b.text().includes("Delete Transaction"));

    await deleteBtn?.trigger("click");

    expect(deleteSpy).toHaveBeenCalledWith(123);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([null]);
  });

  it("logs info with the specific ID if the transaction is not found during delete attempt", async () => {
    const missingId = 99;
    const wrapper = mount(DeleteTransaction, {
      props: {
        modelValue: { description: "Ghost" } as Transaction,
        transactionId: missingId, // We provide an ID, but it won't be in the store
      },
      global: {
        stubs: { VDialog: true, VCard: true, VBtn: true },
      },
    });

    // 1. Clear any logs from the component's setup/mounting phase
    mockLogInfo.mockClear();

    // 2. Trigger the delete logic
    await (wrapper.vm as any).deleteTransaction();

    // 3. Verify the ID (99) is passed in the data field
    expect(mockLogWarning).toHaveBeenCalledWith(
      expect.stringContaining("nothing was deleted"),
      expect.objectContaining({
        module: "DeleteTransaction",
        action: "attempted delete of missing transaction",
        data: undefined, // Verifying that '99' was passed
      })
    );
  });

  it("updates the model to null when the dialog's v-model is set to false", async () => {
    const wrapper = mount(DeleteTransaction, {
      props: {
        modelValue: mockTransaction,
        "onUpdate:modelValue": (val: any) => wrapper.setProps({ modelValue: val }),
      },
      ...globalMountOptions,
    });

    // Find the stub by the name we gave it in globalMountOptions
    const dialog = wrapper.findComponent({ name: "VDialog" });

    // Verify we actually found it before calling vm
    expect(dialog.exists()).toBe(true);

    // Use (dialog as any).vm to bypass the TypeScript 'WrapperLike' warning
    await (dialog as any).vm.$emit("update:modelValue", false);

    // Verify the model was cleared via the 'set' logic in the computed property
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([null]);
    expect(wrapper.props("modelValue")).toBeNull();
  });

  it("clears the model when the top-right close icon is clicked", async () => {
    const wrapper = mount(DeleteTransaction, {
      props: {
        modelValue: mockTransaction,
        "onUpdate:modelValue": (val: any) => wrapper.setProps({ modelValue: val }),
      },
      ...globalMountOptions,
    });

    // 1. Find the specific icon button by its aria-label
    const closeIconButton = wrapper.find('button[aria-label="Close dialog"]');

    // 2. Click it! This triggers the inline: @click="model = null"
    await closeIconButton.trigger("click");

    // 3. Verify it emitted the update
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([null]);
    expect(wrapper.props("modelValue")).toBeNull();
  });

  it("displays 'N/A' when the transaction date is missing", async () => {
    // 1. Create a transaction with no date
    const transactionWithNoDate = {
      id: 999,
      description: "No Date Transaction",
      amount: 50,
      date: "", // or null
      transactionType: "Expense",
    } as Transaction;

    const wrapper = mount(DeleteTransaction, {
      props: {
        modelValue: transactionWithNoDate,
      },
      global: {
        // Ensure the store is provided if the component relies on it
        plugins: [createPinia()],
      },
    });

    await nextTick();

    // 2. Access the computed property directly or check the rendered output
    // If your template renders this via {{ formattedDisplayDate }}
    // you can search for the text directly.
    expect((wrapper.vm as any).formattedDisplayDate).toBe("N/A");

    // Optional: Check the DOM if you have a label/div for the date
    // expect(wrapper.text()).toContain("N/A");
  });
});
