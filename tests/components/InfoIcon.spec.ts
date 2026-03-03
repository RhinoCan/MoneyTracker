// tests/components/InfoIcon.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import InfoIcon from "@/components/InfoIcon.vue";

describe("InfoIcon.vue", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders an icon element", () => {
      const wrapper = mount(InfoIcon, { props: { text: "Helpful info" } });
      expect(wrapper.find(".v-icon").exists()).toBe(true);
    });

    it("uses default aria-label when title is not provided", () => {
      const wrapper = mount(InfoIcon, { props: { text: "Some info" } });
      const icon = wrapper.find(".v-icon");
      expect(icon.attributes("aria-label")).toBe("Information");
    });

    it("uses title as aria-label when provided", () => {
      const wrapper = mount(InfoIcon, {
        props: { text: "Some info", title: "Custom Title" },
      });
      const icon = wrapper.find(".v-icon");
      expect(icon.attributes("aria-label")).toBe("Custom Title");
    });
  });

  // -------------------------------------------------------------------------
  // handleClick — stops propagation
  // -------------------------------------------------------------------------
  describe("handleClick", () => {
    it("calls stopPropagation on click", async () => {
      const wrapper = mount(InfoIcon, { props: { text: "info" } });
      const icon = wrapper.find(".v-icon");

      const mockEvent = {
        stopPropagation: vi.fn(),
        preventDefault: vi.fn(),
      };

      // Call the component's handleClick directly via the component instance
      const vm = wrapper.vm as any;
      vm.handleClick(mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });
});
