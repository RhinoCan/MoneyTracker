// @/stores/UserStore.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase, type Database } from "@/lib/supabase";
import posthog from "posthog-js";
import { logException, logInfo } from "@/lib/Logger";
import type { User, Session } from "@supabase/supabase-js";
import { i18n } from "@/i18n";

// --- ORCHESTRATION IMPORTS ---
import { useSettingsStore } from "@/stores/SettingsStore";
import { useTransactionStore } from "@/stores/TransactionStore";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (i18n.global as any).t;

export type SystemSetting = Database["public"]["Tables"]["system_settings"]["Row"];

export const useUserStore = defineStore("user", () => {
  // --- STATE ---
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!session.value);
  const userEmail = computed(() => user.value?.email ?? null);
  const userId = computed<string | null>(() => user.value?.id ?? null);
  const isInitialized = ref(false);

  /**
   * runFullInitialization
   * The core sequence: Auth -> Settings -> Transactions
   */
  async function runFullInitialization() {
    try {
      if (isInitialized.value) return; //prevent re-runs
      isInitialized.value = true;

      // 1. Settings (Hydrate existing or Seed defaults)
      const settingsStore = useSettingsStore();
      await settingsStore.loadSettings();

      // 2. Data (Fetch the user's transactions)
      const transactionStore = useTransactionStore();
      await transactionStore.fetchTransactions();

      logInfo("Application data sequence complete.", {
        module: "UserStore",
        action: "runFullInitialization",
      });
    } catch (error) {
      isInitialized.value = false; //reset on failure so it can retry
      logException(error, {
        module: "UserStore",
        action: "runFullInitialization",
        slug: t("userStore.initChainFailed"),
      });
    }
  }

  /**
   * initializeAuth
   * Sets up the session and the persistent listener for auth changes.
   */
  async function initializeAuth() {
    loading.value = true;
    try {
      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;

      session.value = initialSession;
      user.value = initialSession?.user ?? null;

      // Handle the "Refresh" case where session already exists
      if (initialSession?.user) {
        await runFullInitialization();
      }

      // Set up the listener for Login/Logout events
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user ?? null;

        if (newSession?.user) {
          posthog.identify(newSession.user.id, {
            email: newSession.user.email,
          });

          logInfo(`Auth event: ${event}`, {
            module: "UserStore",
            action: "onAuthStateChange",
            data: { event, userId: newSession.user.id },
          });

          // Run the full setup sequence on login (but not token refreshes)
          if (event === "SIGNED_IN") {
            await runFullInitialization();
          }
        } else {
          posthog.reset();
          isInitialized.value = false; //allow re-initialization on next login
          // Clear local data on logout if necessary
          const transactionStore = useTransactionStore();
          transactionStore.transactions = [];
        }
      });
    } catch (error) {
      logException(error, {
        module: "UserStore",
        action: "initializeAuth",
        slug: t("userStore.authFailed"),
      });
      throw error;
    } finally {
      loading.value = false;
    }
  }

  /**
   * signOut
   */
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      user.value = null;
      session.value = null;
    } catch (error) {
      logException(error, {
        module: "UserStore",
        action: "signOut",
        slug: t("userStore.signoutFailed"),
      });
    }
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    userEmail,
    userId,
    initializeAuth,
    signOut,
  };
});
