// tests/components/TrackerAbout.spec.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TrackerAbout from "@/components/TrackerAbout.vue";

describe("TrackerAbout.vue", () => {
  // -------------------------------------------------------------------------
  // Rendering — panel header (always visible)
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mount(TrackerAbout);
      expect(wrapper.exists()).toBe(true);
    });

    it("renders an expansion panel", () => {
      const wrapper = mount(TrackerAbout);
      expect(wrapper.find(".v-expansion-panels").exists()).toBe(true);
    });

    it("renders the About title in the panel header", () => {
      const wrapper = mount(TrackerAbout);
      expect(wrapper.text()).toContain("About");
    });

    it("renders 7 tech stack items when panel is expanded", async () => {
      const wrapper = mount(TrackerAbout);
      const header = wrapper.find(".v-expansion-panel-title");
      await header.trigger("click");
      await wrapper.vm.$nextTick();
      // Look for the logo images which are always present in the tech stack
      const logoImgs = wrapper.findAll("img.logo-img");
      expect(logoImgs.length).toBe(7);
    });

    it("renders the Origins section when expanded", async () => {
      const wrapper = mount(TrackerAbout);
      const header = wrapper.find(".v-expansion-panel-title");
      await header.trigger("click");
      expect(wrapper.text()).toContain("Origins");
    });

    it("renders the Packages section when expanded", async () => {
      const wrapper = mount(TrackerAbout);
      const header = wrapper.find(".v-expansion-panel-title");
      await header.trigger("click");
      expect(wrapper.text()).toContain("Major Packages Used");
    });

    it("renders the Acknowledgements section when expanded", async () => {
      const wrapper = mount(TrackerAbout);
      const header = wrapper.find(".v-expansion-panel-title");
      await header.trigger("click");
      expect(wrapper.text()).toContain("Acknowledgements");
    });
  });
});
