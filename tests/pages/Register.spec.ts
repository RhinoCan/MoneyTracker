import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import Register from "@/pages/Register.vue";

// --- MOCKS ---
const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { mockSignUp } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
    },
  },
}));

vi.mock("@/lib/Logger", () => ({
  logException: vi.fn(),
}));

import { logException } from "@/lib/Logger";
import { useNotificationStore } from "@/stores/NotificationStore";

describe("Register.vue", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  function mountComponent() {
    return mount(Register);
  }

  // --- RENDERING ---
  describe("rendering", () => {
    it("renders without errors", () => {
      wrapper = mountComponent();
      expect(wrapper.exists()).toBe(true);
    });
    it("renders the title", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Register");
    });
    it("renders the email field", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Email Address");
    });
    it("renders the password field", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Password");
    });
    it("renders the Sign Up button", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Sign Up");
    });
    it("renders the Back to Login button", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Back to Login");
    });
  });

  // --- NAVIGATION ---
  describe("navigation", () => {
    it("navigates to login when Back to Login is clicked", async () => {
      wrapper = mountComponent();
      const btn = wrapper.findAll(".v-btn").find((b: any) => b.text().includes("Back to Login"));
      await btn.trigger("click");
      expect(mockPush).toHaveBeenCalledWith({ name: "login" });
    });
  });

  // --- VALIDATION ---
  describe("validation", () => {
    it("shows error when email is empty", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      expect(notificationStore.text).toBe("Please fill in all of the fields.");
    });
    it("shows error when password is empty", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleRegister();
      expect(notificationStore.text).toBe("Please fill in all of the fields.");
    });
    it("does not call supabase when fields are empty", async () => {
      wrapper = mountComponent();
      await wrapper.vm.handleRegister();
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  // --- SUCCESSFUL REGISTRATION ---
  describe("successful registration", () => {
    beforeEach(() => {
      mockSignUp.mockResolvedValue({
        data: { user: { id: "u1" }, session: null },
        error: null,
      });
    });

    it("calls signUp with email and password", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret",
      });
    });
    it("shows success notification", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(notificationStore.text).toBe("Registration successful! Check your email for a confirmation link.");
    });
    it("redirects to login on success", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(mockPush).toHaveBeenCalledWith({ name: "login" });
    });
    it("resets loading to false after success", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // --- SUPABASE ERRORS ---
  describe("supabase auth errors", () => {
    it("shows failure message on auth error", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockSignUp.mockResolvedValue({
        data: {}, error: { message: "User already registered" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(notificationStore.text).toBe("Could not complete registration.");
    });
    it("calls logException on auth error", async () => {
      wrapper = mountComponent();
      mockSignUp.mockResolvedValue({
        data: {}, error: { message: "User already registered" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(logException).toHaveBeenCalled();
    });
    it("resets loading to false after auth error", async () => {
      wrapper = mountComponent();
      mockSignUp.mockResolvedValue({
        data: {}, error: { message: "User already registered" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
    it("does not redirect on auth error", async () => {
      wrapper = mountComponent();
      mockSignUp.mockResolvedValue({
        data: {}, error: { message: "User already registered" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // --- UNEXPECTED ERRORS ---
  describe("unexpected errors (catch block)", () => {
    it("shows unexpected error message", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockSignUp.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(notificationStore.text).toBe("Something went wrong. Please try again later.");
    });
    it("calls logException in catch block", async () => {
      wrapper = mountComponent();
      mockSignUp.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(logException).toHaveBeenCalled();
    });
    it("resets loading to false after unexpected error", async () => {
      wrapper = mountComponent();
      mockSignUp.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleRegister();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });
});