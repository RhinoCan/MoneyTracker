import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import ForgotPassword from "@/pages/ForgotPassword.vue";

// --- MOCKS ---
const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { mockResetPasswordForEmail } = vi.hoisted(() => ({
  mockResetPasswordForEmail: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  },
}));

vi.mock("@/lib/Logger", () => ({
  logWarning: vi.fn(),
}));

import { logWarning } from "@/lib/Logger";
import { useNotificationStore } from "@/stores/NotificationStore";

describe("ForgotPassword.vue", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  function mountComponent() {
    return mount(ForgotPassword, {
      global: {
        stubs: { "v-date-picker": true },
      },
    });
  }

  // --- RENDERING ---
  describe("rendering", () => {
    it("renders without errors", () => {
      wrapper = mountComponent();
      expect(wrapper.exists()).toBe(true);
    });
    it("renders the title", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Forgot Password");
    });
    it("renders the instruction text", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Enter your email address");
    });
    it("renders the email field", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Email Address");
    });
    it("renders the Send Reset Link button", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Send Reset Link");
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
      await wrapper.vm.handleForgotPassword();
      expect(notificationStore.text).toContain("fill");
    });
    it("does not call supabase when email is empty", async () => {
      wrapper = mountComponent();
      await wrapper.vm.handleForgotPassword();
      expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
    });
  });

  // --- SUCCESSFUL SUBMISSION ---
  describe("successful submission", () => {
    beforeEach(() => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
    });

    it("calls resetPasswordForEmail with the email", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "a@b.com",
        expect.objectContaining({ redirectTo: expect.stringContaining("reset-password") })
      );
    });
    it("shows success notification", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(notificationStore.text).toBe("Password reset email sent. Please check your inbox.");
    });
    it("redirects to login on success", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(mockPush).toHaveBeenCalledWith({ name: "login" });
    });
    it("resets loading to false after success", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // --- SUPABASE ERRORS ---
  describe("supabase errors", () => {
    it("shows error message on supabase error", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "Email rate limit exceeded" },
      });
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(notificationStore.text).toBe("An error occurred. Please try again.");
    });
    it("calls logWarning on supabase error", async () => {
      wrapper = mountComponent();
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "Email rate limit exceeded" },
      });
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(logWarning).toHaveBeenCalled();
    });
    it("does not redirect on error", async () => {
      wrapper = mountComponent();
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "Email rate limit exceeded" },
      });
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(mockPush).not.toHaveBeenCalled();
    });
    it("resets loading to false after error", async () => {
      wrapper = mountComponent();
      mockResetPasswordForEmail.mockResolvedValue({
        error: { message: "Email rate limit exceeded" },
      });
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // --- UNEXPECTED ERRORS ---
  describe("unexpected errors (catch block)", () => {
    it("shows error message on unexpected error", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockResetPasswordForEmail.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(notificationStore.text).toBe("An error occurred. Please try again.");
    });
    it("calls logWarning in catch block", async () => {
      wrapper = mountComponent();
      mockResetPasswordForEmail.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(logWarning).toHaveBeenCalled();
    });
    it("resets loading to false after unexpected error", async () => {
      wrapper = mountComponent();
      mockResetPasswordForEmail.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleForgotPassword();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });
});