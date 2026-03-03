// tests/components/Amount.spec.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import Amount from "@/components/Amount.vue";

// Mock useCurrencyFormatter so we control the output
const mockFormatCurrency = vi.fn((amount: number) => `$${amount.toFixed(2)}`);
vi.mock("@/composables/useCurrencyFormatter", () => ({
  useCurrencyFormatter: () => ({ formatCurrency: mockFormatCurrency }),
}));

vi.mock("@/i18n", () => ({
  i18n: {
    global: {
      locale: { value: "en-US" },
      t: (key: string) => key,
      te: () => false,
    },
  },
}));

describe("Amount.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockFormatCurrency.mockImplementation((amount: number) => `$${amount.toFixed(2)}`);
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe("rendering", () => {
    it("renders a span with class money-display", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "Income" } });
      expect(wrapper.find("span.money-display").exists()).toBe(true);
    });

    it("displays the formatted amount", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "Income" } });
      expect(wrapper.text()).toContain("$100.00");
    });

    it("displays '---' for null amount", () => {
      mockFormatCurrency.mockReturnValue("---");
      const wrapper = mount(Amount, { props: { amount: null } });
      expect(wrapper.text()).toContain("---");
    });
  });

  // -------------------------------------------------------------------------
  // numericAmount — safe conversion
  // -------------------------------------------------------------------------
  describe("numericAmount conversion", () => {
    it("parses a string amount", () => {
      const wrapper = mount(Amount, { props: { amount: "123.45", type: "Income" } });
      expect(mockFormatCurrency).toHaveBeenCalledWith(123.45);
    });

    it("treats NaN string as 0", () => {
      const wrapper = mount(Amount, { props: { amount: "abc" } });
      expect(mockFormatCurrency).toHaveBeenCalledWith(0);
    });

    it("treats null as 0", () => {
      const wrapper = mount(Amount, { props: { amount: null } });
      expect(mockFormatCurrency).toHaveBeenCalledWith(0);
    });

    it("treats undefined as 0", () => {
      const wrapper = mount(Amount, {});
      expect(mockFormatCurrency).toHaveBeenCalledWith(0);
    });
  });

  // -------------------------------------------------------------------------
  // colorClass logic
  // -------------------------------------------------------------------------
  describe("colorClass", () => {
    it("applies money-plus for type 'Income'", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "Income" } });
      expect(wrapper.find("span").classes()).toContain("money-plus");
    });

    it("applies money-minus for type 'Expense'", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "Expense" } });
      expect(wrapper.find("span").classes()).toContain("money-minus");
    });

    it("applies money-plus for type 'plus'", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "plus" } });
      expect(wrapper.find("span").classes()).toContain("money-plus");
    });

    it("applies money-minus for type 'minus'", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "minus" } });
      expect(wrapper.find("span").classes()).toContain("money-minus");
    });

    it("applies money-plus for positive Balance", () => {
      const wrapper = mount(Amount, { props: { amount: 100, type: "Balance" } });
      expect(wrapper.find("span").classes()).toContain("money-plus");
    });

    it("applies money-minus for negative Balance", () => {
      const wrapper = mount(Amount, { props: { amount: -50, type: "Balance" } });
      expect(wrapper.find("span").classes()).toContain("money-minus");
    });

    it("applies no color class when type is not provided", () => {
      const wrapper = mount(Amount, { props: { amount: 100 } });
      const classes = wrapper.find("span").classes();
      expect(classes).not.toContain("money-plus");
      expect(classes).not.toContain("money-minus");
    });
  });
});
