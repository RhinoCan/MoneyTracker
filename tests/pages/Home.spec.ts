import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import Home from "@/pages/Home.vue";

vi.mock("@/lib/supabase", () => ({ supabase: { from: vi.fn() } }));

describe("Home.vue", () => {
  function mountComponent() {
    return mount(Home, {
      global: {
        stubs: {
          TrackerAbout: true,
          AccountSummary: true,
          TransactionHistory: true,
          AddTransaction: true,
        },
      },
    });
  }

  it("renders without errors", () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it("renders TrackerAbout", () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: "TrackerAbout" }).exists()).toBe(true);
  });

  it("renders AccountSummary", () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: "AccountSummary" }).exists()).toBe(true);
  });

  it("renders TransactionHistory", () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: "TransactionHistory" }).exists()).toBe(true);
  });

  it("renders AddTransaction", () => {
    const wrapper = mountComponent();
    expect(wrapper.findComponent({ name: "AddTransaction" }).exists()).toBe(true);
  });
});