// @/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { supabase } from "@/lib/supabase";
import { logException } from "@/lib/Logger";

// 1. Define Routes with RouteRecordRaw for full TS support
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    // Using explicit components for core pages is fine,
    // but consider lazy-loading if the app grows.
    component: () => import("@/pages/Home.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/pages/Login.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("@/pages/Register.vue"),
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("@/pages/ForgotPassword.vue"),
  },
  {
    path: "/reset-password",
    name: "reset-password",
    component: () => import("@/pages/ResetPassword.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

/**
 * Navigation Guard
 * Checks authentication state before every route change.
 */
router.beforeEach(async (to, from, next) => {
  try {

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    const isLoggedIn = !!session;

    // A. Protected Route Access Control
    if (to.meta.requiresAuth && !isLoggedIn) {
      return next({ name: "login" });
    }

    // B. Public Page Access Control
    const isAuthPage =
      to.name === "login" ||
      to.name === "register";
    if (isAuthPage && isLoggedIn) {
      return next({ name: "home" });
    }

    next();
  } catch (error) {
    logException(error, {
      module: "Router",
      action: "navigationGuard",
      slug: "router.auth_check_failed",
    });

    if (to.name === "login") {
      next();
    } else {
      next({ name: "login" });
    }
  }
});

export default router;
