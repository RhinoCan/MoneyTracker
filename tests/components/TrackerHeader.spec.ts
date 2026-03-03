// tests/components/TrackerHeader.spec.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";
import TrackerHeader from "@/components/TrackerHeader.vue";

const { mockPush, mockSignOut } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/stores/UserStore", () => ({
  useUserStore: vi.fn(),
}));

vi.mock("@/components/Settings.vue", () => ({
  default: { name: "Settings", template: "<div class='mock-settings' />" },
}));

vi.mock("@/components/DataManagement.vue", () => ({
  default: { name: "DataManagement", template: "<div class='mock-data-management' />" },
}));

import { useUserStore } from "@/stores/UserStore";

function mockUserStore(overrides = {}) {
  (useUserStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    isAuthenticated: false,
    userEmail: null,
    userId: null,
    signOut: mockSignOut,
    ...overrides,
  });
}

// v-app-bar requires a v-layout parent — wrap it
function mountInLayout(options = {}) {
  return mount(TrackerHeader, {
    global: {
      stubs: {
        // Stub VAppBar to avoid the layout injection requirement
        VAppBar: {
          name: "VAppBar",
          template: "<div class='v-app-bar'><slot /></div>",
        },
        VAppBarTitle: {
          name: "VAppBarTitle",
          template: "<div class='v-app-bar-title'><slot /></div>",
        },
        VDialog: {
          name: "VDialog",
          props: ["modelValue"],
          template: "<div class='v-dialog'><slot v-if='modelValue' /></div>",
        },
      },
    },
    ...options,
  });
}

describe("TrackerHeader.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockUserStore();
  });

  describe("rendering", () => {
    it("renders without errors", () => {
      const wrapper = mountInLayout();
      expect(wrapper.exists()).toBe(true);
    });

    it("renders the app title", () => {
      const wrapper = mountInLayout();
      expect(wrapper.text()).toContain("Money Tracker");
    });

    it("renders the environment chip", () => {
      const wrapper = mountInLayout();
      expect(wrapper.find(".v-chip").exists()).toBe(true);
    });

    it("shows Dev environment chip when VITE_APP_ENV is not set", () => {
      const wrapper = mountInLayout();
      expect(wrapper.text()).toContain("Dev");
    });
  });

  describe("authentication state", () => {
    it("does not show logout button when not authenticated", () => {
      mockUserStore({ isAuthenticated: false });
      const wrapper = mountInLayout();
      const btns = wrapper.findAll(".v-btn");
      const logoutBtn = btns.find((b) => b.text().includes("Log"));
      expect(logoutBtn).toBeUndefined();
    });

    it("shows logout button when authenticated", () => {
      mockUserStore({ isAuthenticated: true, userEmail: "user@example.com" });
      const wrapper = mountInLayout();
      expect(wrapper.text()).toContain("Log");
    });

    it("shows user email when authenticated", () => {
      mockUserStore({ isAuthenticated: true, userEmail: "user@example.com" });
      const wrapper = mountInLayout();
      expect(wrapper.text()).toContain("user@example.com");
    });
  });

  describe("handleLogout", () => {
    it("calls userStore.signOut on logout", async () => {
      mockUserStore({ isAuthenticated: true, userEmail: "user@example.com" });
      const wrapper = mountInLayout();
      const logoutBtn = wrapper.findAll(".v-btn").find((b) => b.text().toLowerCase().includes("log"));
      await logoutBtn!.trigger("click");
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("redirects to /login after successful logout", async () => {
      mockUserStore({ isAuthenticated: true, userEmail: "user@example.com" });
      const wrapper = mountInLayout();
      const logoutBtn = wrapper.findAll(".v-btn").find((b) => b.text().toLowerCase().includes("log"));
      await logoutBtn!.trigger("click");
      await wrapper.vm.$nextTick();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("does not redirect if signOut throws", async () => {
      mockSignOut.mockRejectedValueOnce(new Error("Sign out failed"));
      mockUserStore({ isAuthenticated: true, userEmail: "user@example.com" });
      const wrapper = mountInLayout();
      const logoutBtn = wrapper.findAll(".v-btn").find((b) => b.text().toLowerCase().includes("log"));
      await logoutBtn!.trigger("click");
      await wrapper.vm.$nextTick();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("dialog triggers", () => {
    it("opens settings dialog when settings button is clicked", async () => {
      const wrapper = mountInLayout();
      const settingsBtn = wrapper.find("#showSettings");
      await settingsBtn.trigger("click");
      expect((wrapper.vm as any).showSettings).toBe(true);
    });

    it("opens data management dialog when data button is clicked", async () => {
      const wrapper = mountInLayout();
      const dataBtn = wrapper.find("#showDataManagement");
      await dataBtn.trigger("click");
      expect((wrapper.vm as any).showDataManagement).toBe(true);
    });
  });
});
