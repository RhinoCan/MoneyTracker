import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import InfoIcon from "@/components/InfoIcon.vue";

describe("InfoIcon.vue", () => {

  it("renders the icon and shows content on click", async () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });
    const wrapper = mount(InfoIcon, {
      props: {
        title: "Test Title",
        text: "This is the tooltip content",
        maxWidth: 250
      }
    });

    // 1. Verify icon exists
    const icon = wrapper.find(".v-icon");
    expect(icon.exists()).toBe(true);

    // 2. Test event stopping logic in handleClick
    const event = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn()
    } as unknown as Event;

    // Call the method directly to cover handleClick logic
    (wrapper.vm as any).handleClick(event);
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();

    // 3. Trigger the menu click
    await icon.trigger("click");
    await nextTick();

    // Note: Vuetify menus often render in a 'v-overlay-container'
    // outside the wrapper. We check the document body if necessary.
    expect(document.body.innerHTML).toContain("Test Title");
    expect(document.body.innerHTML).toContain("This is the tooltip content");
  });

  it("does not render title div when title prop is missing", async () => {
    const wrapper = mount(InfoIcon, {
      props: { text: "Only text" }
    });

    const icon = wrapper.find(".v-icon");
    await icon.trigger("click");
    await nextTick();

    // Verify title class is absent
    expect(document.body.innerHTML).not.toContain("text-subtitle-2");
  });
});