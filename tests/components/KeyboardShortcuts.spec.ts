// tests/components/KeyboardShortcuts.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import KeyboardShortcuts from "@/components/KeyboardShortcuts.vue";

describe("KeyboardShortcuts.vue", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mount(KeyboardShortcuts);
      expect(wrapper.exists()).toBe(true);
    });

    it("renders the keyboard title", () => {
      const wrapper = mount(KeyboardShortcuts);
      expect(wrapper.text()).toContain("Keyboard Shortcuts");
    });

    it("renders the Esc key", () => {
      const wrapper = mount(KeyboardShortcuts);
      expect(wrapper.text()).toContain("Esc");
    });

    it("renders the Enter key", () => {
      const wrapper = mount(KeyboardShortcuts);
      expect(wrapper.text()).toContain("Enter");
    });

    it("renders the Tab key", () => {
      const wrapper = mount(KeyboardShortcuts);
      expect(wrapper.text()).toContain("Tab");
    });

    it("renders the Close button", () => {
      const wrapper = mount(KeyboardShortcuts);
      expect(wrapper.text()).toContain("Close");
    });
  });

  // -------------------------------------------------------------------------
  // Emits
  // -------------------------------------------------------------------------
  describe("emits", () => {
    it("emits close when the Close button is clicked", async () => {
      const wrapper = mount(KeyboardShortcuts);
      const buttons = wrapper.findAll(".v-btn");
      // The last button is the Close button in v-card-actions
      const closeButton = buttons[buttons.length - 1];
      await closeButton.trigger("click");
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("emits close when the X icon button is clicked", async () => {
      const wrapper = mount(KeyboardShortcuts);
      const buttons = wrapper.findAll(".v-btn");
      // The first button is the X icon in the title bar
      await buttons[0].trigger("click");
      expect(wrapper.emitted("close")).toBeTruthy();
    });
  });
});
