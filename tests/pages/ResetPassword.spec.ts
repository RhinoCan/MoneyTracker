import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import ResetPassword from "@/pages/ResetPassword.vue";

// --- MOCKS ---
const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { mockOnAuthStateChange, mockUpdateUser, mockGetSession, mockSignOut } = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn(),
  mockUpdateUser: vi.fn(),
  mockGetSession: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
  },
}));

vi.mock("@/lib/Logger", () => ({
  logWarning: vi.fn(),
  logValidation: vi.fn(),
}));

import { logWarning, logValidation } from "@/lib/Logger";
import { useNotificationStore } from "@/stores/NotificationStore";

describe("ResetPassword.vue", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    // Default: no existing session, no PASSWORD_RECOVERY event
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  function mountComponent() {
    return mount(ResetPassword, {
      global: {
        stubs: { "v-date-picker": true },
      },
    });
  }

  async function mountWithSession() {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok", user: { id: "u1" } } },
    });
    const w = mount(ResetPassword, {
      global: {
        stubs: { "v-date-picker": true },
      },
    });
    await flushPromises();
    return w;
  }

  function mountWithRecoveryEvent() {
    mockOnAuthStateChange.mockImplementation((callback: (event: string) => void) => {
      callback("PASSWORD_RECOVERY");
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    return mount(ResetPassword, {
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
      expect(wrapper.text()).toContain("Reset Password");
    });
    it("shows invalid token message when no session and no recovery event", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.text()).toContain("invalid or has expired");
    });
    it("shows the form when a valid session exists", async () => {
      wrapper = await mountWithSession();
      expect(wrapper.text()).toContain("New Password");
    });
    it("shows the form when PASSWORD_RECOVERY event fires", async () => {
      wrapper = mountWithRecoveryEvent();
      await flushPromises();
      expect(wrapper.text()).toContain("New Password");
    });
    it("shows Back to Login button when token is invalid", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.text()).toContain("Back to Login");
    });
  });

  // --- VALIDATION ---
  describe("validation", () => {
    it("shows error when fields are empty", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      await wrapper.vm.handleResetPassword();
      expect(notificationStore.text).toContain("fill");
    });
    it("shows error when password is too short", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      wrapper.vm.password = "short";
      wrapper.vm.confirmPassword = "short";
      await wrapper.vm.handleResetPassword();
      expect(notificationStore.text).toContain("8 characters");
    });
    it("shows error when passwords do not match", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      wrapper.vm.password = "password123";
      wrapper.vm.confirmPassword = "different123";
      await wrapper.vm.handleResetPassword();
      expect(notificationStore.text).toContain("do not match");
    });
    it("does not call supabase when validation fails", async () => {
      wrapper = await mountWithSession();
      wrapper.vm.password = "short";
      wrapper.vm.confirmPassword = "short";
      await wrapper.vm.handleResetPassword();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // --- SUCCESSFUL RESET ---
  describe("successful reset", () => {
    beforeEach(() => {
      mockUpdateUser.mockResolvedValue({ error: null });
    });

    it("calls updateUser with the new password", async () => {
      wrapper = await mountWithSession();
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    });
    it("calls signOut after successful password update", async () => {
      wrapper = await mountWithSession();
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(mockSignOut).toHaveBeenCalled();
    });
    it("shows success notification", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(notificationStore.text).toBe(
        "Password reset successful. Please log in with your new password."
      );
    });
    it("redirects to login on success", async () => {
      wrapper = await mountWithSession();
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(mockPush).toHaveBeenCalledWith({ name: "login" });
    });
    it("resets loading to false after success", async () => {
      wrapper = await mountWithSession();
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // --- SUPABASE ERRORS ---
  describe("supabase errors", () => {
    it("shows error message on supabase error", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(notificationStore.text).toBe("An error occurred. Please try again.");
    });
    it("calls logWarning on supabase error", async () => {
      wrapper = await mountWithSession();
      mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(logWarning).toHaveBeenCalled();
      expect(logValidation).not.toHaveBeenCalled();
    });
    it("calls logValidation when the new password matches the previous password", async () => {
      wrapper = await mountWithSession();
      mockUpdateUser.mockResolvedValue({
        error: { message: "New password should be different from the old password." },
      });
      wrapper.vm.password = "previouspassword123";
      wrapper.vm.confirmPassword = "previouspassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(logValidation).toHaveBeenCalledWith(
        "resetPassword.reusedPasswordError",
        expect.objectContaining({
          module: "ResetPassword",
          action: "handleResetPassword",
          slug: "reset_password.reused_password",
        })
      );
      expect(logWarning).not.toHaveBeenCalled();
    });
    it("does not show a separate snackbar when password is reused (logValidation handles it)", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      // Clear any prior messages
      notificationStore.text = "";
      mockUpdateUser.mockResolvedValue({
        error: { message: "New password should be different from the old password." },
      });
      wrapper.vm.password = "previouspassword123";
      wrapper.vm.confirmPassword = "previouspassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      // logValidation drives the snackbar — the component must not call showMessage separately
      expect(notificationStore.text).not.toBe("An error occurred. Please try again.");
    });
    it("does not redirect on error", async () => {
      wrapper = await mountWithSession();
      mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(mockPush).not.toHaveBeenCalled();
    });
    it("resets loading to false after error", async () => {
      wrapper = await mountWithSession();
      mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // --- UNEXPECTED ERRORS ---
  describe("unexpected errors (catch block)", () => {
    it("shows error message on unexpected error", async () => {
      wrapper = await mountWithSession();
      const notificationStore = useNotificationStore();
      mockUpdateUser.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(notificationStore.text).toBe("An error occurred. Please try again.");
    });
    it("calls logWarning in catch block", async () => {
      wrapper = await mountWithSession();
      mockUpdateUser.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(logWarning).toHaveBeenCalled();
    });
    it("resets loading to false after unexpected error", async () => {
      wrapper = await mountWithSession();
      mockUpdateUser.mockRejectedValueOnce(new Error("Network failure"));
      wrapper.vm.password = "newpassword123";
      wrapper.vm.confirmPassword = "newpassword123";
      await wrapper.vm.handleResetPassword();
      await flushPromises();
      expect(wrapper.vm.loading).toBe(false);
    });
  });
});
