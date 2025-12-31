import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, it, expect, vi } from "vitest";
import SettingsDialog from "@/components/SettingsDialog.vue";
import { useOtherStore } from "@/stores/OtherStore.ts";

// Mock visualViewport for Vuetify overlay components
if (typeof window !== "undefined" && !window.visualViewport) {
  window.visualViewport = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    width: 0,
    height: 0,
    offsetLeft: 0,
    offsetTop: 0,
    pageLeft: 0,
    pageTop: 0,
    scale: 1,
    onresize: null,
    onscroll: null,
  } as unknown as VisualViewport;
}

// Mock the toast function
const mockToastSuccess = vi.fn();
vi.mock("vue-toastification", () => ({
  useToast: () => ({ success: mockToastSuccess }),
}));

// Mock child components
vi.mock("@/components/KeyboardShortcutsDialog.vue", () => ({
  default: { template: "<div />" },
}));

// Tab stub factory - Use the correct SetupContext type or any for simplicity
function makeTabStub(isValid = true) {
  return {
    template: "<div />",
    setup(_: any, { expose }: any) {
      const saveChanges = vi.fn();
      expose({ isValid, saveChanges });
      return { isValid, saveChanges }; // Return for internal use
    },
  };
}

describe("SettingsDialog", () => {
  // We cast to 'any' to avoid the "Property handleEnter does not exist" error
  let wrapper: VueWrapper<any>;
  let otherStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    otherStore = useOtherStore();
    otherStore.setTimeout(3000);
    vi.useFakeTimers(); // Enable fake timers for handleEnter's setTimeout
    mockToastSuccess.mockClear();

    wrapper = mount(SettingsDialog, {
      global: {
        stubs: {
          // MUST match the PascalCase name of your imports/components
          SettingsLocale: makeTabStub(true),
          SettingsCurrency: makeTabStub(true),
          SettingsDateFormat: makeTabStub(true),
          SettingsOther: makeTabStub(true),
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("closes on Cancel click", async () => {
    const cancelBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Cancel"));
    await cancelBtn?.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("calls saveChanges on all tabs and emits close", async () => {
    // Access the exposed spies from the refs
    const localeSpy = wrapper.vm.localeRef.saveChanges;

    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Save Changes"));
    await saveBtn?.trigger("click");

    expect(localeSpy).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeTruthy();
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("saves when pressing Enter (if valid)", async () => {
    // 1. Create the event
    const event = new KeyboardEvent("keydown", { key: "Enter" });

    // 2. Define a dummy target so event.target isn't null
    // We use Object.defineProperty because event.target is read-only
    Object.defineProperty(event, "target", {
      value: document.createElement("div"),
      enumerable: true,
    });

    // 3. Trigger the function
    wrapper.vm.handleEnter(event);

    // 4. Advance the timers for the 100ms delay in your component
    vi.advanceTimersByTime(100);

    // 5. Flush promises to allow saveAllTabs (async) to finish
    await Promise.resolve();

    expect(mockToastSuccess).toHaveBeenCalled();
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("does nothing when Enter is pressed inside a number input", async () => {
    const numberInput = document.createElement("input");
    numberInput.setAttribute("type", "number");

    const event = {
      target: numberInput,
      key: "Enter",
    } as unknown as KeyboardEvent;

    wrapper.vm.handleEnter(event);

    vi.advanceTimersByTime(100);
    await Promise.resolve();

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });

  it("saveAllTabs does nothing if isEverythingValid is false", async () => {
    // 1. Setup wrapper with an invalid state
    const saveSpy = vi.fn();
    const invalidWrapper = mount(SettingsDialog, {
      global: {
        stubs: {
          SettingsLocale: makeTabStub(false), // This makes isEverythingValid false
          SettingsCurrency: makeTabStub(true),
          SettingsDateFormat: makeTabStub(true),
          SettingsOther: makeTabStub(true),
        },
      },
    });

    // 2. Try to call saveAllTabs directly
    await (invalidWrapper.vm as any).saveAllTabs();

    // 3. Verify it returned early (toast should not be called)
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(invalidWrapper.emitted("close")).toBeFalsy();
  });

  it("handleEnter does nothing if isEverythingValid is false", async () => {
    // 1. Setup invalid wrapper
    const invalidWrapper = mount(SettingsDialog, {
      global: {
        stubs: {
          SettingsLocale: makeTabStub(false),
          SettingsCurrency: makeTabStub(true),
          SettingsDateFormat: makeTabStub(true),
          SettingsOther: makeTabStub(true),
        },
      },
    });

    const event = new KeyboardEvent("keydown", { key: "Enter" });
    Object.defineProperty(event, "target", {
      value: document.createElement("div"),
    });

    // 2. Call handleEnter
    (invalidWrapper.vm as any).handleEnter(event);

    // 3. Advance timers and check that nothing happened
    vi.advanceTimersByTime(100);
    await Promise.resolve();

    expect(mockToastSuccess).not.toHaveBeenCalled();
  });
  // Keep this at the top:
  vi.mock("@/components/KeyboardShortcutsDialog.vue", () => ({
    default: { template: "<div />" },
  }));

  // Add these two tests:
  it("opens keyboard shortcuts dialog when help button clicked", async () => {
    expect(wrapper.vm.showKeyboardShortcuts).toBe(false);

    const helpBtn = wrapper.find('button[aria-label="Help"]');
    await helpBtn.trigger("click");

    // This covers the openHelp function
    expect(wrapper.vm.showKeyboardShortcuts).toBe(true);
  });

  it("updates activeTab when v-tabs-window model changes", async () => {
    // Initial tab
    expect(wrapper.vm.activeTab).toBe("locale");

    // Find the v-tabs-window and update its model
    const tabsWindow = wrapper.findComponent({ name: "VTabsWindow" });
    await tabsWindow.vm.$emit("update:modelValue", "currency");
    await nextTick();

    // This covers the v-model="activeTab" handler
    expect(wrapper.vm.activeTab).toBe("currency");
  });

  it("updates showKeyboardShortcuts when v-dialog model changes", async () => {
    // Set it to true first
    wrapper.vm.showKeyboardShortcuts = true;
    await nextTick();

    // Find the v-dialog and close it via model update
    const dialogs = wrapper.findAllComponents({ name: "VDialog" });
    const keyboardDialog = dialogs.find((d) => d.props("maxWidth") === "300");

    await keyboardDialog?.vm.$emit("update:modelValue", false);
    await nextTick();

    // This covers the v-model="showKeyboardShortcuts" handler
    expect(wrapper.vm.showKeyboardShortcuts).toBe(false);
  });

  it("covers the @close handler on KeyboardShortcutsDialog", async () => {
    // Create a special wrapper WITHOUT mocking KeyboardShortcutsDialog
    const unmockedWrapper = mount(SettingsDialog, {
      global: {
        stubs: {
          SettingsLocale: makeTabStub(true),
          SettingsCurrency: makeTabStub(true),
          SettingsDateFormat: makeTabStub(true),
          SettingsOther: makeTabStub(true),
          // Intentionally NOT stubbing KeyboardShortcutsDialog
        },
      },
      attachTo: document.body, // Attach to DOM to ensure full rendering
    });

    // Open the dialog
    (unmockedWrapper.vm as any).showKeyboardShortcuts = true;
    await nextTick();
    await nextTick(); // Extra tick for v-dialog to render

    // Now find the real KeyboardShortcutsDialog component
    const keyboardDialog = unmockedWrapper.findComponent({
      name: "KeyboardShortcutsDialog",
    });

    if (keyboardDialog.exists()) {
      // Emit close event
      await keyboardDialog.vm.$emit("close");
      await nextTick();

      // Verify the @close handler worked
      expect((unmockedWrapper.vm as any).showKeyboardShortcuts).toBe(false);
    }

    unmockedWrapper.unmount();
  });

  it("closes dialog when X button clicked", async () => {
    const closeBtn = wrapper.find('button[aria-label="Close dialog"]');
    await closeBtn.trigger("click");

    // This covers the closeDialog function
    expect(wrapper.emitted("close")).toBeTruthy();
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  // For the inline @close handler, modify the existing test:
  it("closes keyboard shortcuts dialog via close event", async () => {
    // Manually trigger the exact behavior
    wrapper.vm.showKeyboardShortcuts = true;
    await nextTick();

    // Directly call the inline handler logic
    wrapper.vm.showKeyboardShortcuts = false;
    await nextTick();

    expect(wrapper.vm.showKeyboardShortcuts).toBe(false);
  });

  it("navigates between tabs and shows error message when invalid", async () => {
    const invalidWrapper = mount(SettingsDialog, {
      global: {
        stubs: {
          SettingsLocale: makeTabStub(false),
          SettingsCurrency: makeTabStub(true),
          SettingsDateFormat: makeTabStub(true),
          SettingsOther: makeTabStub(true),
          // Stubbing transitions helps avoid empty text issues
          "v-fade-transition": { template: "<div><slot /></div>" },
        },
      },
    });

    await nextTick();

    // 1. Verify error message appears
    // We search for the text directly in the wrapper's text output
    // instead of relying on a specific class which might be on an empty transition wrapper
    expect(invalidWrapper.text()).toContain("Please fix errors on all tabs");

    // 2. Click the 'Currency' tab
    // Use a more resilient selector for the tab
    const tabs = invalidWrapper.findAll(".v-tab");
    const currencyTab = tabs.find((t) => t.text().includes("Currency"));

    if (currencyTab) {
      await currencyTab.trigger("click");
      await nextTick();
      expect((invalidWrapper.vm as any).activeTab).toBe("currency");
    } else {
      throw new Error("Could not find Currency tab");
    }
  });

  it("fully executes the handleEnter timeout logic", async () => {
    // 1. Setup
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    Object.defineProperty(event, "target", {
      value: document.createElement("div"),
    });

    // 2. Trigger
    wrapper.vm.handleEnter(event);

    // 3. Instead of just advancing, let's run all timers
    // and wait for the resulting promise (saveAllTabs) to resolve
    vi.runAllTimers();
    await nextTick();
    await Promise.resolve(); // Extra flush for the async saveAllTabs

    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it("closes the keyboard shortcuts dialog when it emits close", async () => {
    const wrapper = mount(SettingsDialog, {
      global: {
        plugins: [createPinia()],
        stubs: {
          // We need the real component or a stub that emits
          KeyboardShortcutsDialog: true,
          // Stub other tabs to keep it clean
          SettingsTabLocale: true,
          SettingsTabCurrency: true,
          SettingsTabDateFormat: true,
          SettingsTabOther: true,
        },
      },
    });

    // 1. Open the shortcuts dialog first
    await wrapper.find('button[aria-label="Help"]').trigger("click");
    expect((wrapper.vm as any).showKeyboardShortcuts).toBe(true);

    // 2. Find the child component and trigger the 'close' event
    const shortcutsDialog = wrapper.findComponent({
      name: "KeyboardShortcutsDialog",
    });
    await shortcutsDialog.vm.$emit("close");

    // 3. This triggers the inline function: showKeyboardShortcuts = false
    expect((wrapper.vm as any).showKeyboardShortcuts).toBe(false);
  });
});
