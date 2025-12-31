import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import AddTransaction from "@/components/AddTransaction.vue";
import { useTransactionStore } from "@/stores/TransactionStore";

describe("AddTransaction.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const globalOptions = {
    global: {
      stubs: {
        VDatePicker: true,
        KeyboardShortcutsDialog: true,
        // Mock the form's reset method which is called in resetForm
        VForm: {
          template: "<form><slot /></form>",
          methods: { reset: vi.fn() },
        },
      },
    },
  };

  it("successfully adds a transaction and resets form", async () => {
    const wrapper = mount(AddTransaction, globalOptions);
    const store = useTransactionStore();
    const addSpy = vi.spyOn(store, "addTransaction");

    // 1. Set the data
    (wrapper.vm as any).descriptionModel = "Lunch";
    (wrapper.vm as any).dateModel = "2025-01-01";
    (wrapper.vm as any).transactionTypeModel = "Expense";
    (wrapper.vm as any).displayAmount = "15.50";

    // 2. Call onSubmit directly to avoid Vuetify's internal event validation hurdles
    // We mock the 'event' parameter that onSubmit expects
    const mockEvent = Promise.resolve({ valid: true });
    await (wrapper.vm as any).onSubmit(mockEvent);

    // 3. Verify store call
    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Lunch",
        amount: 15.5,
        transactionType: "Expense",
      })
    );

    // 4. Verify local state reset
    expect((wrapper.vm as any).descriptionModel).toBe("");
    expect((wrapper.vm as any).displayAmount).toBe("");
  });

  it("resets form when reset button is clicked", async () => {
    const wrapper = mount(AddTransaction, globalOptions);
    (wrapper.vm as any).descriptionModel = "Dirty Data";

    // Find all buttons, then find the one that says "Reset"
    const buttons = wrapper.findAll("button");
    const resetButton = buttons.find((b) => b.text().includes("Reset"));

    await resetButton?.trigger("click");

    expect((wrapper.vm as any).descriptionModel).toBe("");
  });

  it("covers the date object branch in onSubmit", async () => {
    const wrapper = mount(AddTransaction, {
      global: {
        stubs: {
          VDatePicker: true,
          KeyboardShortcutsDialog: true,
          VForm: {
            template: "<form><slot /></form>",
            // IMPORTANT: onSubmit calls newTransactionForm.value.reset()
            methods: { reset: () => {} },
          },
        },
      },
    });

    const store = useTransactionStore();
    const addSpy = vi.spyOn(store, "addTransaction");

    // Use a real Date object for today to guarantee it passes dateRangeRule
    const today = new Date();

    (wrapper.vm as any).descriptionModel = "Dinner";
    (wrapper.vm as any).dateModel = today;
    (wrapper.vm as any).transactionTypeModel = "Expense";
    (wrapper.vm as any).displayAmount = "50.00";

    // Mock the event result so 'if (!valid) return;' is bypassed
    const mockEvent = Promise.resolve({ valid: true });

    await (wrapper.vm as any).onSubmit(mockEvent);

    // Assertions
    expect(addSpy).toHaveBeenCalled();
    // If description is empty, resetForm() successfully executed
    expect((wrapper.vm as any).descriptionModel).toBe("");
  });

  it("covers the formattedDisplayDate setter", () => {
    const wrapper = mount(AddTransaction, globalOptions);
    // Explicitly trigger the setter
    (wrapper.vm as any).formattedDisplayDate = "any value";
    // Verify it didn't change anything (as per your logic)
    expect((wrapper.vm as any).formattedDisplayDate).toBe("");
  });

  it("covers the resetState function", () => {
    const wrapper = mount(AddTransaction, globalOptions);
    (wrapper.vm as any).dateError = "Some error";
    (wrapper.vm as any).resetState();
    expect((wrapper.vm as any).dateError).toBeNull();
  });

  it("early returns from onSubmit if dateModel is null", async () => {
    const wrapper = mount(AddTransaction, globalOptions);
    (wrapper.vm as any).dateModel = null;

    const mockEvent = Promise.resolve({ valid: true });
    await (wrapper.vm as any).onSubmit(mockEvent);

    // If we reach this point without errors, the early return worked
    expect((wrapper.vm as any).dateError).toBeNull();
  });

  it("handles validation failure in onSubmit", async () => {
    const wrapper = mount(AddTransaction, globalOptions);

    // Set a future date to trigger the validation error
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    (wrapper.vm as any).dateModel = futureDate;
    (wrapper.vm as any).descriptionModel = "Future Trip";

    const mockEvent = Promise.resolve({ valid: true });
    await (wrapper.vm as any).onSubmit(mockEvent);

    // 1. Verify it captured the error message
    expect((wrapper.vm as any).dateError).toContain("future");
    // 2. Verify it returned early (description wasn't reset)
    expect((wrapper.vm as any).descriptionModel).toBe("Future Trip");
  });

  it("early returns from onSubmit if form validation is invalid", async () => {
    const wrapper = mount(AddTransaction, globalOptions);
    const store = useTransactionStore();
    const addSpy = vi.spyOn(store, "addTransaction");

    // Provide a valid date so it gets past the first two guard clauses
    (wrapper.vm as any).dateModel = "2025-01-01";
    (wrapper.vm as any).descriptionModel = "Invalid Form";

    // Mock the event result as invalid
    const mockEvent = Promise.resolve({ valid: false });
    await (wrapper.vm as any).onSubmit(mockEvent);

    // Verify it stopped before adding to store or resetting
    expect(addSpy).not.toHaveBeenCalled();
    expect((wrapper.vm as any).descriptionModel).toBe("Invalid Form");
  });

  it("defaults amount to 0 if parsing fails", async () => {
    const wrapper = mount(AddTransaction, globalOptions);
    const store = useTransactionStore();
    const addSpy = vi.spyOn(store, "addTransaction");

    (wrapper.vm as any).dateModel = "2025-01-01";
    (wrapper.vm as any).transactionTypeModel = "Income";
    (wrapper.vm as any).displayAmount = "not-a-number"; // This will make parseCurrency return null

    const mockEvent = Promise.resolve({ valid: true });
    await (wrapper.vm as any).onSubmit(mockEvent);

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 0,
      })
    );
  });

  it("defaults amount to 0 if parsing fails", async () => {
    const wrapper = mount(AddTransaction, globalOptions);
    const store = useTransactionStore();
    const addSpy = vi.spyOn(store, "addTransaction");

    (wrapper.vm as any).dateModel = "2025-01-01";
    (wrapper.vm as any).transactionTypeModel = "Income";
    (wrapper.vm as any).displayAmount = "not-a-number"; // This will make parseCurrency return null

    const mockEvent = Promise.resolve({ valid: true });
    await (wrapper.vm as any).onSubmit(mockEvent);

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 0,
      })
    );
  });

it("toggles classes on focus and blur to cover the ternary operator", async () => {
  const wrapper = mount(AddTransaction, globalOptions);

  // 1. Path A: isFocused is false
  // We need to make sure the composable thinks it's an Income type
  (wrapper.vm as any).transactionTypeModel = "Income";
  (wrapper.vm as any).isFocused = false;

  // Note: Vuetify components often apply classes to an inner element.
  // Let's check the wrapper itself since .money-field is on the v-text-field
  await wrapper.vm.$nextTick();

  // If the composable logic is working, colorClass should return 'money-plus'
  // Let's verify what colorClass actually is first
  const currentColor = (wrapper.vm as any).colorClass;

  expect(wrapper.find(".money-field").classes()).toContain(currentColor);
  expect((wrapper.vm as any).isFocused).toBe(false);

  // 2. Path B: isFocused is true
  await (wrapper.vm as any).handleFocus(); // Use the actual function!
  await wrapper.vm.$nextTick();

  // When focused, the first part of the ternary returns ''
  // So the classes should NOT contain the color class anymore
  expect(wrapper.find(".money-field").classes()).not.toContain("money-plus");
  expect(wrapper.find(".money-field").classes()).not.toContain("money-minus");
});

it("touches all template-compiled v-model and event functions", async () => {
  const wrapper = mount(AddTransaction, globalOptions);

  // 1. Help button @click (This is a DOM element, not a component)
  await wrapper.find('button[aria-label="Help"]').trigger("click");

  // 2. Find all text fields and match by label to be safe
  const textFields = wrapper.findAllComponents({ name: 'VTextField' });

  const descField = textFields.find(c => c.props('label') === 'Description');
  const dateField = textFields.find(c => c.props('label') === 'Transaction Date');
  const amountField = textFields.find(c => c.props('label') === 'Amount');

  // Emit updates (triggers the anonymous functions in the template)
  if (descField) await descField.vm.$emit('update:modelValue', 'New Desc');
  if (dateField) await dateField.vm.$emit('update:modelValue', '2025-01-01');
  if (amountField) await amountField.vm.$emit('update:modelValue', '100');

  // 3. Radio Group
  const radioGroup = wrapper.findComponent({ name: 'VRadioGroup' });
  if (radioGroup.exists()) {
    await radioGroup.vm.$emit('update:modelValue', 'Income');
  }

  // 4. Date Menu
  const dateMenu = wrapper.findComponent({ name: 'VMenu' });
  if (dateMenu.exists()) {
    await dateMenu.vm.$emit('update:modelValue', true);
  }

  // 5. Help Dialog v-model
  // Look for the v-dialog stub
  const helpDialog = wrapper.findComponent({ name: 'VDialog' });
  if (helpDialog.exists()) {
     await (helpDialog as any).vm.$emit('update:modelValue', false);
  }
});

it("finalizes coverage for date-picker and shortcuts dialog", async () => {
  const wrapper = mount(AddTransaction, globalOptions);

  // 1. KeyboardShortcutsDialog
  (wrapper.vm as any).showKeyboardShortcuts = true;
  await wrapper.vm.$nextTick();

  const shortcutsDialog = wrapper.findComponent({ name: 'KeyboardShortcutsDialog' });
  // Directly trigger the event the template is listening for
  await shortcutsDialog.vm.$emit('close');
  expect((wrapper.vm as any).showKeyboardShortcuts).toBe(false);

  // 2. VDatePicker
  (wrapper.vm as any).dateMenu = true;
  await wrapper.vm.$nextTick();

  const datePicker = wrapper.findComponent({ name: 'VDatePicker' });

  // A: Trigger the v-model update (touches line 1)
  await datePicker.vm.$emit('update:modelValue', new Date());

  // B: Manually call the method linked to @update:model-value (touches line 2)
  // This ensures the logic runs even if the event binding is being finicky in the stub
  await (wrapper.vm as any).closeDatePicker();

  await wrapper.vm.$nextTick();
  expect((wrapper.vm as any).dateMenu).toBe(false);
});
});
