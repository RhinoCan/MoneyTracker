import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import Login from "@/pages/Login.vue";

// --- MOCKS ---
const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { mockSignInWithPassword } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  },
}));

vi.mock("@/lib/Logger", () => ({
  logException: vi.fn(),
}));

import { logException } from "@/lib/Logger";
import { useNotificationStore } from "@/stores/NotificationStore";

describe("Login.vue", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  function mountComponent() {
    return mount(Login, {
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
      expect(wrapper.text()).toContain("Login");
    });
    it("renders the email field", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Email Address");
    });
    it("renders the password field", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Password");
    });
    it("renders the Sign In button", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Sign In");
    });
    it("renders the no account prompt", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Don't have an account?");
    });
    it("renders the Register button", () => {
      wrapper = mountComponent();
      expect(wrapper.text()).toContain("Register");
    });
  });

  // --- NAVIGATION ---
  describe("navigation", () => {
    it("navigates to register when Register button is clicked", async () => {
      wrapper = mountComponent();
      const btn = wrapper.findAll(".v-btn").find((b: any) => b.text().includes("Register"));
      await btn.trigger("click");
      expect(mockPush).toHaveBeenCalledWith({ name: "register" });
    });
  });

  // --- VALIDATION ---
  describe("validation", () => {
    it("shows error when email is empty", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      expect(notificationStore.text).toContain("fill");
    });
    it("shows error when password is empty", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.email = "a@b.com";
      await wrapper.vm.handleLogin();
      expect(notificationStore.text).toContain("fill");
    });
    it("does not call supabase when fields are empty", async () => {
      wrapper = mountComponent();
      await wrapper.vm.handleLogin();
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });
  });

  // --- SUCCESSFUL LOGIN ---
  describe("successful login", () => {
    beforeEach(() => {
      mockSignInWithPassword.mockResolvedValue({
        data: { session: { access_token: "tok" }, user: { id: "u1" } },
        error: null,
      });
    });

    it("calls signInWithPassword with email and password", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "a@b.com",
        password: "secret",
      });
    });
    it("shows success notification", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(notificationStore.text).toBe("Login successful.");
    });
    it("redirects to home on success", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(mockPush).toHaveBeenCalledWith("/");
    });
    it("resets loading to false after success", async () => {
      wrapper = mountComponent();
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // --- SUPABASE ERRORS ---
  describe("supabase auth errors", () => {
    it("shows generic error message on unknown error", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockSignInWithPassword.mockResolvedValue({
        data: {}, error: { message: "Something went wrong" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(notificationStore.text).toBe("Login failed. Please try again.");
    });
    it("shows unconfirmed email message", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockSignInWithPassword.mockResolvedValue({
        data: {}, error: { message: "Email not confirmed" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(notificationStore.text).toBe("Please confirm your email before logging in.");
    });
    it("shows invalid credentials message", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockSignInWithPassword.mockResolvedValue({
        data: {}, error: { message: "Invalid login credentials" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(notificationStore.text).toBe("Invalid email or password.");
    });
    it("calls logException on auth error", async () => {
      wrapper = mountComponent();
      mockSignInWithPassword.mockResolvedValue({
        data: {}, error: { message: "Invalid login credentials" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(logException).toHaveBeenCalled();
    });
    it("resets loading to false after error", async () => {
      wrapper = mountComponent();
      mockSignInWithPassword.mockResolvedValue({
        data: {}, error: { message: "Invalid login credentials" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
    it("does not redirect on error", async () => {
      wrapper = mountComponent();
      mockSignInWithPassword.mockResolvedValue({
        data: {}, error: { message: "Invalid login credentials" },
      });
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // --- UNEXPECTED ERRORS ---
  describe("unexpected errors (catch block)", () => {
    it("shows unexpected error message", async () => {
      wrapper = mountComponent();
      const notificationStore = useNotificationStore();
      mockSignInWithPassword.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(notificationStore.text).toBe("An unexpected error occurred during login.");
    });
    it("calls logException in catch block", async () => {
      wrapper = mountComponent();
      mockSignInWithPassword.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(logException).toHaveBeenCalled();
    });
    it("resets loading to false after unexpected error", async () => {
      wrapper = mountComponent();
      mockSignInWithPassword.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.email = "a@b.com";
      wrapper.vm.password = "secret";
      await wrapper.vm.handleLogin();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });
});