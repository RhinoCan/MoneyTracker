// @/router/index.ts
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { supabase } from "@/lib/supabase";
import { logException } from "@/lib/Logger";
import { i18n } from "@/i18n";

const t = (i18n.global as any).t;

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
    meta: { requiresAuth: false },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("@/pages/Register.vue"),
    meta: { requiresAuth: false },
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
    // Check session with Supabase
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

    // B. Public Page Access Control (Bounce logged-in users away from Login/Register)
    const isAuthPage = to.name === "login" || to.name === "register";
    if (isAuthPage && isLoggedIn) {
      return next({ name: "home" });
    }

    // C. Proceed as normal
    next();
  } catch (error) {
    // Log failures (network, session expiry, etc.)
    logException(error, {
      module: "Router",
      action: "navigationGuard",
      slug: t("router.auth_check_failed"),
    });

    // Recovery: Send to login unless they are already trying to go there
    if (to.name === "login") {
      next();
    } else {
      next({ name: "login" });
    }
  }
});

export default router;
