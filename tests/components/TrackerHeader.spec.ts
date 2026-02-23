import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import TrackerHeader from "@/components/TrackerHeader.vue";
import { VChip, VBtn } from "vuetify/components";

describe("TrackerHeader.vue", () => {
  const mountOptions = {
    global: {
      stubs: {
        // 1. Stub the bar to prevent the "layout" error
        VAppBar: { template: '<div class="v-app-bar-stub"><slot /></div>' },
        // 2. Stub the dialog so we don't have to deal with overlays
        SettingsDialog: true,
        VDialog: true,
      },
      components: {
        VChip,
        VBtn,
      },
    },
  };

  it("renders with 'Dev Server' environment by default", () => {
    const wrapper = mount(TrackerHeader, mountOptions);

    // Use findComponent so TypeScript knows it has .props()
    const chip = wrapper.findComponent(VChip);
    expect(chip.text()).toBe("Dev Server");
    expect(chip.props("color")).toBe("warning");
  });

  it("renders with 'Live' environment when VITE_APP_ENV is set", () => {
    vi.stubEnv("VITE_APP_ENV", "production");
    const wrapper = mount(TrackerHeader, mountOptions);

    const chip = wrapper.findComponent(VChip);
    expect(chip.text()).toBe("Live (GitHub Pages)");
    expect(chip.props("color")).toBe("success");

    vi.unstubAllEnvs();
  });

  it("opens the settings dialog when button is clicked", async () => {
    const wrapper = mount(TrackerHeader, mountOptions);

    // Use findComponent for the button to be safe
    const btn = wrapper.findComponent("#showSettings");
    await btn.trigger("click");

    expect((wrapper.vm as any).showSettings).toBe(true);
  });

  it("updates showSettings when the dialog emits update:modelValue", async () => {
    const wrapper = mount(TrackerHeader, mountOptions);

    // 1. Manually trigger the event that v-model listens for
    const dialog = wrapper.findComponent({ name: "v-dialog" });
    await dialog.vm.$emit("update:modelValue", true);
    expect((wrapper.vm as any).showSettings).toBe(true);

    // 2. Trigger it again with false to fully exercise the logic
    await dialog.vm.$emit("update:modelValue", false);
    expect((wrapper.vm as any).showSettings).toBe(false);
  });
});
