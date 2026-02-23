import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import SettingsTabLocale from "@/components/SettingsTabLocale.vue";
import { useLocaleStore } from "@/stores/LocaleStore";

describe("SettingsTabLocale", () => {
  let wrapper: VueWrapper<any>;
  let localeStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    localeStore = useLocaleStore();

    // Mock initial state
    localeStore.availableLocales = [
      { name: "English (US)", code: "en-US" },
      { name: "German (Germany)", code: "de-DE" },
    ];
    localeStore.currentLocale = "en-US";

    wrapper = mount(SettingsTabLocale);
  });

  describe("Initialization", () => {
    it("loads initial locale from the store into the local ref", () => {
      expect(wrapper.vm.selectedLocale).toBe("en-US");
    });

    it("correctly maps store locales to select items via computed property", () => {
      // This verifies the 'locales' computed property mapping logic
      expect(wrapper.vm.locales).toEqual([
        { label: "English (US)", value: "en-US" },
        { label: "German (Germany)", value: "de-DE" },
      ]);
    });

    it("exposes isValid as true", () => {
      expect(wrapper.vm.isValid).toBe(true);
    });
  });

  describe("Reactivity and Actions", () => {
    it("updates selectedLocale when v-select emits update", async () => {
      const select = wrapper.findComponent({ name: "VSelect" });

      // Trigger the v-model setter in the template
      await select.vm.$emit("update:modelValue", "de-DE");
      await nextTick();

      expect(wrapper.vm.selectedLocale).toBe("de-DE");
    });

    it("does not update the store immediately on change", async () => {
      const storeSpy = vi.spyOn(localeStore, "updateLocale");

      wrapper.vm.selectedLocale = "de-DE";
      await nextTick();

      expect(storeSpy).not.toHaveBeenCalled();
    });

    it("updates the store when saveChanges is called", () => {
      const storeSpy = vi.spyOn(localeStore, "updateLocale");

      wrapper.vm.selectedLocale = "de-DE";
      wrapper.vm.saveChanges();

      expect(storeSpy).toHaveBeenCalledWith("de-DE");
    });
  });
});
