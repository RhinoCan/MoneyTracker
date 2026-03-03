import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

// --- MOCKS ---
const { mockInitializeAuth, mockLoading } = vi.hoisted(() => ({
  mockInitializeAuth: vi.fn().mockResolvedValue(undefined),
  mockLoading: { value: false },
}));

vi.mock("@/stores/UserStore", () => ({
  useUserStore: () => ({
    initializeAuth: mockInitializeAuth,
    get loading() { return mockLoading.value; },
  }),
}));

vi.mock("@/stores/SettingsStore", () => ({
  useSettingsStore: () => ({
    locale: "en-US",
    messageTimeoutSeconds: 5,
  }),
}));

vi.mock("@/stores/NotificationStore", () => ({
  useNotificationStore: () => ({
    isVisible: false,
    color: "success",
    text: "",
    snackbarKey: 0,
  }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(),
    },
  },
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterView: { template: "<div />" },
}));

vi.mock("@/components/TrackerHeader.vue", () => ({
  default: { template: "<div />" },
}));

import App from "@/App.vue";

describe("App.vue", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockInitializeAuth.mockResolvedValue(undefined);
    mockLoading.value = false;
  });

  afterEach(() => {
    wrapper?.unmount();
    document.documentElement.dir = "ltr";
    document.documentElement.lang = "";
  });

  function mountComponent() {
    return mount(App, {
      global: {
        stubs: {
          TrackerHeader: true,
          RouterView: true,
          VMain: { template: "<div><slot /></div>" },
          VSnackbar: { template: "<div><slot /><slot name='actions' /></div>" },
        },
      },
    });
  }

  // --- RENDERING: NORMAL STATE ---
  describe("normal state rendering", () => {
    it("renders without errors", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    });

    it("does not show the fatal error UI by default", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.text()).not.toContain("Application Failed to Start");
    });

    it("does not show the loading spinner by default", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.find("v-progress-circular").exists()).toBe(false);
    });

    it("shows loading spinner when userStore.loading is true", async () => {
      mockLoading.value = true;
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.html()).toContain("v-progress-circular");
    });
  });

  // --- RENDERING: FATAL ERROR STATE ---
  describe("fatal error state", () => {
    it("shows fatal error UI when initializeAuth throws", async () => {
      mockInitializeAuth.mockRejectedValueOnce(new Error("Boot failed"));
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.text()).toContain("Application Failed to Start");
    });

    it("shows the noStart message", async () => {
      mockInitializeAuth.mockRejectedValueOnce(new Error("Boot failed"));
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.text()).toContain("We couldn't start the application");
    });

    it("shows the Retry Connection button", async () => {
      mockInitializeAuth.mockRejectedValueOnce(new Error("Boot failed"));
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.text()).toContain("Retry Connection");
    });

    it("calls window.location.reload when retry button is clicked", async () => {
      vi.stubGlobal("location", { reload: vi.fn() });
      mockInitializeAuth.mockRejectedValueOnce(new Error("Boot failed"));
      wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.retryInit();
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  // --- BOOT SEQUENCE ---
  describe("boot sequence", () => {
    it("calls initializeAuth on mount", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(mockInitializeAuth).toHaveBeenCalledOnce();
    });

    it("clears fatalError before calling initializeAuth", async () => {
      mockInitializeAuth.mockRejectedValueOnce(new Error("Boot failed"));
      wrapper = mountComponent();
      await flushPromises();
      expect(wrapper.vm.fatalError).toBe(true);
      mockInitializeAuth.mockResolvedValueOnce(undefined);
      await wrapper.vm.bootApp();
      await flushPromises();
      expect(wrapper.vm.fatalError).toBe(false);
    });
  });

  // --- LOCALE WATCHER ---
  describe("locale watcher", () => {
    it("sets document.documentElement.lang on mount", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(document.documentElement.lang).toBeTruthy();
    });

    it("sets dir to ltr for non-RTL locales", async () => {
      wrapper = mountComponent();
      await flushPromises();
      expect(document.documentElement.dir).toBe("ltr");
    });

    it("sets dir to rtl for Arabic locale", async () => {
      wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.$i18n.locale = "ar";
      await flushPromises();
      expect(document.documentElement.dir).toBe("rtl");
    });
  });
});