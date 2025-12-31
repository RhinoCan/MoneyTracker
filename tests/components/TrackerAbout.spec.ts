import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import TrackerAbout from "@/components/TrackerAbout.vue";

describe("TrackerAbout.vue", () => {
  it("renders correctly and displays the about information when expanded", async () => {
    const wrapper = mount(TrackerAbout);

    // 1. Initially, it only contains the title
    expect(wrapper.text()).toContain("About");
    expect(wrapper.text()).not.toContain("Origins");

    // 2. Click the title to expand it
    const title = wrapper.find(".v-expansion-panel-title");
    await title.trigger("click");
    await nextTick(); // Wait for Vuetify to render the content

    // 3. Now the content should be visible
    expect(wrapper.text()).toContain("Origins");
    expect(wrapper.text()).toContain("Major Packages Used");

    const images = wrapper.findAll("img");
    expect(images.length).toBe(3);
  });

  it("contains the link to the original course when expanded", async () => {
    const wrapper = mount(TrackerAbout);

    // Expand the panel first
    await wrapper.find(".v-expansion-panel-title").trigger("click");
    await nextTick();

    const link = wrapper.find("a");
    expect(link.attributes("href")).toContain("youtube.com/watch?v=hNPwdOZ3qFU");
  });

  it("renders the expansion panel with correct initial icon", () => {
    const wrapper = mount(TrackerAbout);

    // This stays the same - checking the icon in the header (which is always there)
    const icon = wrapper.find(".v-icon");
    expect(icon.exists()).toBe(true);
    expect(icon.attributes("class")).toContain("mdi-chevron-down");
  });
});