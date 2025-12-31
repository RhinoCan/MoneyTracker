import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import Money from "@/components/Money.vue";

describe("Money.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders positive Income as 'plus'", () => {
    const wrapper = mount(Money, {
      props: { amount: 100, type: "Income" }
    });
    expect(wrapper.classes()).toContain("plus");
    expect(wrapper.text()).toContain("100.00"); // Assuming USD default
  });

  it("renders Expense as 'minus'", () => {
    const wrapper = mount(Money, {
      props: { amount: 50, type: "Expense" }
    });
    expect(wrapper.classes()).toContain("minus");
  });

  describe("Balance logic", () => {
    it("renders positive Balance as 'plus'", () => {
      const wrapper = mount(Money, {
        props: { amount: 10, type: "Balance" }
      });
      expect(wrapper.classes()).toContain("plus");
    });

    it("renders negative Balance as 'minus'", () => {
      const wrapper = mount(Money, {
        props: { amount: -10, type: "Balance" }
      });
      expect(wrapper.classes()).toContain("minus");
    });

    it("renders zero Balance as 'plus'", () => {
      const wrapper = mount(Money, {
        props: { amount: 0, type: "Balance" }
      });
      // Based on your code: props.amount < 0 ? "minus" : "plus"
      expect(wrapper.classes()).toContain("plus");
    });
  });

  it("falls back to empty string for unknown type", () => {
    // Casting to any to test the 'default' switch case
    const wrapper = mount(Money, {
      props: { amount: 100, type: "Unknown" as any }
    });
    expect(wrapper.classes()).not.toContain("plus");
    expect(wrapper.classes()).not.toContain("minus");
  });
});