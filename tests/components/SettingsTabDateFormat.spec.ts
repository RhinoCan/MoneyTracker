import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { nextTick } from "vue";
import SettingsTabDateFormat from "@/components/SettingsTabDateFormat.vue";
import { useDateFormatStore } from "@/stores/DateFormatStore";
import { DateFormatTemplate } from "@/types/CommonTypes";

describe("SettingsTabDateFormat", () => {
  let wrapper: VueWrapper<any>;
  let dateStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    dateStore = useDateFormatStore();

    // Set an initial store value
    dateStore.setDateFormat(DateFormatTemplate.ISO);

    wrapper = mount(SettingsTabDateFormat);
  });

  describe("Initialization", () => {
    it("loads initial values from the store into the local model", () => {
      expect(wrapper.vm.dateFormatModel).toBe(DateFormatTemplate.ISO);
    });

    it("exposes isValid as true by default", () => {
      expect(wrapper.vm.isValid).toBe(true);
    });
  });

  describe("Actions and Reactivity", () => {
    it("updates the local model when the select emits a change", async () => {
      const select = wrapper.findComponent({ name: "VSelect" });

      // Trigger the v-model setter
      await select.vm.$emit("update:modelValue", DateFormatTemplate.EUR);
      await nextTick();

      expect(wrapper.vm.dateFormatModel).toBe(DateFormatTemplate.EUR);
    });

    it("does not update the store until saveChanges is called", async () => {
      const storeSpy = vi.spyOn(dateStore, "setDateFormat");

      // Change local value
      wrapper.vm.dateFormatModel = DateFormatTemplate.USA;
      await nextTick();

      expect(storeSpy).not.toHaveBeenCalled();

      // Trigger save
      wrapper.vm.saveChanges();
      expect(storeSpy).toHaveBeenCalledWith(DateFormatTemplate.USA);
    });
  });

  describe("UI Configuration", () => {
    it("renders the correct number of date format options", () => {
      const select = wrapper.findComponent({ name: "VSelect" });
      // Access the items prop passed to the VSelect
      expect(select.props("items").length).toBe(3);
    });
  });
});