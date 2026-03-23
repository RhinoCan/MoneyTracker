import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("@/lib/Logger", () => ({
  logException: vi.fn(),
}));

import { logException } from "@/lib/Logger";
import router from "@/router";

describe("router navigation guard", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    await router.push("/login");
  });

  // --- UNAUTHENTICATED USER ---
  describe("unauthenticated user (no session)", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    });

    it("redirects to login when accessing a protected route", async () => {
      await router.push("/");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("allows access to login page", async () => {
      await router.push("/login");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("allows access to register page", async () => {
      await router.push("/register");
      expect(router.currentRoute.value.name).toBe("register");
    });

    // Inside "unauthenticated user (no session)"
    it("allows access to forgot-password page", async () => {
      await router.push("/forgot-password");
      expect(router.currentRoute.value.name).toBe("forgot-password");
    });

    it("allows access to reset-password page", async () => {
      await router.push("/reset-password");
      expect(router.currentRoute.value.name).toBe("reset-password");
    });
  });

  // --- AUTHENTICATED USER ---
  describe("authenticated user (active session)", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok", user: { id: "u1" } } },
        error: null,
      });
    });

    // Inside "authenticated user (active session)"
    it("allows access to reset-password when authenticated", async () => {
      await router.push("/reset-password");
      expect(router.currentRoute.value.name).toBe("reset-password");
    });

    it("redirects away from forgot-password to home when authenticated", async () => {
      await router.push("/forgot-password");
      expect(router.currentRoute.value.name).toBe("home");
    });

    it("allows access to protected home route", async () => {
      await router.push("/");
      expect(router.currentRoute.value.name).toBe("home");
    });

    it("redirects away from login to home", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok", user: { id: "u1" } } },
        error: null,
      });
      await router.push("/register"); // move away from /login first
      await router.push("/login");
      expect(router.currentRoute.value.name).toBe("home");
    });

    it("redirects away from register to home", async () => {
      await router.push("/register");
      expect(router.currentRoute.value.name).toBe("home");
    });
  });

  // --- SESSION ERROR ---
  describe("getSession returns an error", () => {
    it("calls logException", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });
      await router.push("/");
      expect(logException).toHaveBeenCalled();
    });

    it("redirects to login when error occurs on protected route", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });
      await router.push("/");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("allows proceeding to login when error occurs on login route", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });
      await router.push("/login");
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  // --- UNEXPECTED THROW ---
  describe("getSession throws unexpectedly (catch block)", () => {
    beforeEach(() => {
      mockGetSession.mockRejectedValue(new Error("Network failure"));
    });

    it("calls logException", async () => {
      await router.push("/");
      expect(logException).toHaveBeenCalled();
    });

    it("redirects to login on unexpected error", async () => {
      await router.push("/");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("allows proceeding to login when catch occurs on login route", async () => {
      await router.push("/login");
      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
