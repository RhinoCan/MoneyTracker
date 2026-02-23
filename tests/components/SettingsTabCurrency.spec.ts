import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import SettingsTabCurrency from "@/components/SettingsTabCurrency.vue";
import { useCurrencyStore } from "@/stores/CurrencyStore";

describe("SettingsTabCurrency", () => {
  let wrapper: VueWrapper<any>;
  let currencyStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    currencyStore = useCurrencyStore();

    // Set a baseline state in the store
    currencyStore.updateNumberFormat({
      currency: "USD",
      currencyDisplay: "symbol",
      currencySign: "standard",
      minPrecision: 2,
      maxPrecision: 2,
      useGrouping: true,
      useBankersRounding: false,
    });

    wrapper = mount(SettingsTabCurrency);
  });

  describe("Initialization", () => {
    it("loads initial values from the store into local buffer", () => {
      expect(wrapper.vm.localFormat.currencyDisplay).toBe("symbol");
      expect(wrapper.vm.localFormat.minPrecision).toBe(2);
    });

    it("exposes isValid as true by default", () => {
      expect(wrapper.vm.isValid).toBe(true);
    });
  });

  describe("Preview Logic", () => {
    it("updates the preview text when sliders change", async () => {
      // Change precision to 0
      wrapper.vm.localFormat.minPrecision = 0;
      wrapper.vm.localFormat.maxPrecision = 0;
      await nextTick();

      // Check if the preview formatted the negative sample without decimals
      // Sample is -1234560.789. With 0 precision, it should be rounded.
      expect(wrapper.vm.previewAmount).not.toContain(".79");
    });

    it("updates preview when currency display changes", async () => {
      wrapper.vm.localFormat.currencyDisplay = "code";
      await nextTick();

      expect(wrapper.vm.previewAmount).toContain("USD");
    });

    it("handles invalid Intl formats gracefully", async () => {
      // Force an invalid currency code into the local reactive object
      wrapper.vm.localFormat.currency = "INVALID";
      await nextTick();

      expect(wrapper.vm.previewAmount).toBe("Invalid Format");
    });
  });

  describe("Actions", () => {
    it("saves changes to the store only when saveChanges is called", async () => {
      const storeSpy = vi.spyOn(currencyStore, "updateNumberFormat");

      // Modify local state
      wrapper.vm.localFormat.currencyDisplay = "name";

      // Verify store hasn't been called yet
      expect(storeSpy).not.toHaveBeenCalled();

      // Trigger save
      wrapper.vm.saveChanges();

      expect(storeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          currencyDisplay: "name",
        }),
      );
    });
  });

  describe("UI Interactions", () => {
    it("renders all select options correctly", () => {
      const selects = wrapper.findAllComponents({ name: "VSelect" });
      // We expect 2 selects (Display and Sign)
      expect(selects.length).toBe(2);
    });

    it("toggles the useGrouping switch", async () => {
      wrapper.vm.localFormat.useGrouping = false;
      await nextTick();

      // With separator off, the preview should not have commas
      // Note: This depends on the 'undefined' locale in Intl.NumberFormat
      // but usually results in no commas in most test envs
      expect(wrapper.vm.previewAmount).not.toContain(",");
    });

    it("covers all v-model setter functions in the template", async () => {
      // 1. Min Precision
      const minSlider = wrapper
        .findAllComponents({ name: "VSlider" })
        .find((c) => c.props("label") === "Min Decimals");
      await minSlider?.vm.$emit("update:modelValue", 1);
      await nextTick(); // Assignment happens here

      // 2. Max Precision
      const maxSlider = wrapper
        .findAllComponents({ name: "VSlider" })
        .find((c) => c.props("label") === "Max Decimals");
      await maxSlider?.vm.$emit("update:modelValue", 3);
      await nextTick(); // Assignment happens here

      expect(wrapper.vm.localFormat.maxPrecision).toBe(3);

      // 3. Currency Display Select
      const displaySelect = wrapper.findComponent({
        name: "VSelect",
        label: "Currency Display",
      });
      await displaySelect.vm.$emit("update:modelValue", "name");
      expect(wrapper.vm.localFormat.currencyDisplay).toBe("name");

      // 4. Negative Sign Style Select
      const signSelect = wrapper
        .findAllComponents({ name: "VSelect" })
        .find((c) => c.props("label") === "Negative Sign Style");

      if (!signSelect)
        throw new Error("Could not find Negative Sign Style select");

      await signSelect.vm.$emit("update:modelValue", "accounting");
      await nextTick();
      expect(wrapper.vm.localFormat.currencySign).toBe("accounting");

      // 5. Thousands Separator Switch
      const thousandSwitch = wrapper.findComponent({
        name: "VSwitch",
        label: "Use Thousands Separator",
      });
      await thousandSwitch.vm.$emit("update:modelValue", false);
      expect(wrapper.vm.localFormat.useGrouping).toBe(false);

      // 6. Banker's Rounding Switch (Note: The label is in a slot, but name match works)
      // We'll find all switches and find the one that isn't the thousands separator
      const switches = wrapper.findAllComponents({ name: "VSwitch" });
      const bankersSwitch = switches.find(
        (s) => s.props("label") !== "Use Thousands Separator",
      );
      await bankersSwitch?.vm.$emit("update:modelValue", true);
      expect(wrapper.vm.localFormat.useBankersRounding).toBe(true);
    });

    it("validates min precision ranges correctly", async () => {
      // 1. Setup a conflict
      wrapper.vm.localFormat.maxPrecision = 2;
      wrapper.vm.localFormat.minPrecision = 3;

      // Give Vuetify time to recognize the change and run the rules on the VForm
      await nextTick();
      await nextTick(); // Double tick is often needed for VForm validation cycles

      const minSlider = wrapper
        .findAllComponents({ name: "VSlider" })
        .find((c) => c.props("label") === "Min Decimals");

      const rules = minSlider?.props("rules");
      const result = rules[0](3);

      expect(result).toBe("Minimum precision cannot exceed maximum precision");

      // This is the one that was returning true—now it should be false
      expect(wrapper.vm.isValid).toBe(false);
    });

    it("validates max precision ranges correctly", async () => {
      // 1. Setup a conflict
      wrapper.vm.localFormat.maxPrecision = 2;
      wrapper.vm.localFormat.minPrecision = 3;

      // Give Vuetify time to recognize the change and run the rules on the VForm
      await nextTick();
      await nextTick(); // Double tick is often needed for VForm validation cycles

      const maxSlider = wrapper
        .findAllComponents({ name: "VSlider" })
        .find((c) => c.props("label") === "Max Decimals");

      const rules = maxSlider?.props("rules");
      const result = rules[0](1);

      expect(result).toBe(
        "Maximum precision cannot be less than minimum precision",
      );

      // This is the one that was returning true—now it should be false
      expect(wrapper.vm.isValid).toBe(false);
    });

    it("handles undefined minPrecision in maxPrecision rule", async () => {
      const maxSlider = wrapper
        .findAllComponents({ name: "VSlider" })
        .find((c) => c.props("label") === "Max Decimals");

      const rule = maxSlider?.props("rules")[0];

      // 1. Force the reactive value to undefined
      // @ts-ignore - bypassing TS to test the safety fallback
      wrapper.vm.localFormat.minPrecision = undefined;
      await nextTick();

      // 2. Test the rule. Since min is undefined, it defaults to 0.
      // A value of 0 should be valid (true).
      expect(rule(0)).toBe(true);
    });
  });
});
