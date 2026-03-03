// tests/components/Settings.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import Settings from "@/components/Settings.vue";

const { mockSaveToDb } = vi.hoisted(() => ({
  mockSaveToDb: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/stores/SettingsStore", () => ({
  useSettingsStore: vi.fn(),
  localeToCurrency: {
    "en-US": "USD",
    "de-DE": "EUR",
    "ja-JP": "JPY",
    "fr-FR": "EUR",
  },
}));

vi.mock("@/components/InfoIcon.vue", () => ({
  default: { name: "InfoIcon", props: ["text", "maxWidth"], template: "<span class='mock-info-icon' />" },
}));

import { useSettingsStore } from "@/stores/SettingsStore";

function mockSettingsStore(overrides = {}) {
  (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    locale: "en-US",
    currency: "USD",
    messageTimeoutSeconds: -1,
    isLoading: false,
    saveToDb: mockSaveToDb,
    ...overrides,
  });
}

describe("Settings.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSettingsStore();
    mockSaveToDb.mockResolvedValue(undefined);
  });

  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mount(Settings);
      expect(wrapper.exists()).toBe(true);
    });

    it("renders the settings title", () => {
      const wrapper = mount(Settings);
      expect(wrapper.text()).toContain("Settings");
    });

    it("renders the locale select", () => {
      const wrapper = mount(Settings);
      expect(wrapper.find(".v-select").exists()).toBe(true);
    });

    it("renders the persistent message toggle switch", () => {
      const wrapper = mount(Settings);
      expect(wrapper.find(".v-switch").exists()).toBe(true);
    });

    it("renders Cancel and Save buttons", () => {
      const wrapper = mount(Settings);
      const text = wrapper.text();
      expect(text).toContain("Cancel");
      expect(text).toContain("Save Changes");
    });
  });

  describe("persistent message toggle", () => {
    it("shows persistent label when timeout is -1", () => {
      mockSettingsStore({ messageTimeoutSeconds: -1 });
      const wrapper = mount(Settings);
      expect(wrapper.text()).toContain("Persist messages");
    });

    it("does not show slider when timeout is -1 (persistent)", () => {
      mockSettingsStore({ messageTimeoutSeconds: -1 });
      const wrapper = mount(Settings);
      expect(wrapper.find(".v-slider").exists()).toBe(false);
    });

    it("shows slider when timeout is not -1", () => {
      mockSettingsStore({ messageTimeoutSeconds: 5 });
      const wrapper = mount(Settings);
      expect(wrapper.find(".v-slider").exists()).toBe(true);
    });
  });

  describe("handleSave", () => {
    it("calls settingsStore.saveToDb when Save is clicked", async () => {
      const wrapper = mount(Settings);
      const saveBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Save"));
      await saveBtn!.trigger("click");
      await wrapper.vm.$nextTick();
      expect(mockSaveToDb).toHaveBeenCalled();
    });

    it("emits close after successful save", async () => {
      const wrapper = mount(Settings);
      const saveBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Save"));
      await saveBtn!.trigger("click");
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted("close")).toBeTruthy();
    });

    it("does not emit close when saveToDb throws", async () => {
      mockSaveToDb.mockRejectedValueOnce(new Error("DB error"));
      const wrapper = mount(Settings);
      const saveBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Save"));
      await saveBtn!.trigger("click");
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted("close")).toBeFalsy();
    });
  });

  describe("cancel", () => {
    it("emits close when Cancel is clicked", async () => {
      const wrapper = mount(Settings);
      const cancelBtn = wrapper.findAll(".v-btn").find((b) => b.text().includes("Cancel"));
      await cancelBtn!.trigger("click");
      expect(wrapper.emitted("close")).toBeTruthy();
    });
  });

  describe("locale change updates currency", () => {
    it("updates localCurrency when localLocale changes to de-DE", async () => {
      const wrapper = mount(Settings);
      (wrapper.vm as any).localLocale = "de-DE";
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).localCurrency).toBe("EUR");
    });

    it("updates localCurrency when localLocale changes to ja-JP", async () => {
      const wrapper = mount(Settings);
      (wrapper.vm as any).localLocale = "ja-JP";
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).localCurrency).toBe("JPY");
    });
  });

  describe("isMessagePersistent setter", () => {
    it("sets localTimeout to 5 when isMessagePersistent is set to false (covers line 55)", async () => {
      mockSettingsStore({ messageTimeoutSeconds: -1 });
      const wrapper = mount(Settings);

      // Confirm we start in persistent mode (timeout = -1)
      expect((wrapper.vm as any).localTimeout).toBe(-1);

      // Trigger the setter with false — exercises the `on ? -1 : 5` false branch
      (wrapper.vm as any).isMessagePersistent = false;
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).localTimeout).toBe(5);
    });

    it("sets localTimeout to -1 when isMessagePersistent is set to true (covers line 55 true branch)", async () => {
      mockSettingsStore({ messageTimeoutSeconds: 5 });
      const wrapper = mount(Settings);

      expect((wrapper.vm as any).localTimeout).toBe(5);

      (wrapper.vm as any).isMessagePersistent = true;
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).localTimeout).toBe(-1);
    });
  });
});