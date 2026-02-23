import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import KeyboardShortcutsDialog from "@/components/KeyboardShortcutsDialog.vue";

describe("KeyboardShortcutsDialog.vue", () => {
  it("renders correctly and displays shortcut instructions", () => {
    const wrapper = mount(KeyboardShortcutsDialog);

    // Verify Title
    expect(wrapper.find(".v-card-title").text()).toBe("Keyboard Shortcuts");

    // Verify specific shortcut mentions exist
    const text = wrapper.text();
    expect(text).toContain("Esc");
    expect(text).toContain("Enter");
    expect(text).toContain("Tab");
  });

  it("emits 'close' when the close icon is clicked", async () => {
    const wrapper = mount(KeyboardShortcutsDialog);

    // Find the button with the close icon
    const closeIconBtn = wrapper.find('button[aria-label="Close dialog"]');
    await closeIconBtn.trigger("click");

    expect(wrapper.emitted()).toHaveProperty("close");
  });

  it("emits 'close' when the bottom close button is clicked", async () => {
    const wrapper = mount(KeyboardShortcutsDialog);

    // Find the primary button at the bottom
    const closeBtn = wrapper.find(".v-card-actions .v-btn");
    await closeBtn.trigger("click");

    expect(wrapper.emitted()).toHaveProperty("close");
    expect(wrapper.emitted("close")?.length).toBe(1);
  });
});
