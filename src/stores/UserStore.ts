import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import posthog from "posthog-js";
import type { User, Session } from "@supabase/supabase-js";

// --- ORCHESTRATION IMPORTS ---
import { useSettingsStore } from "@/stores/SettingsStore";
import { useTransactionStore } from "@/stores/TransactionStore";

/**
 * useUserStore
 * The central authority for authentication and application hydration.
 */
export const useUserStore = defineStore("user", () => {
  // --- STATE ---
  const user = ref<User | null>(null);
  const session = ref<Session | null>(null);
  const loading = ref(true);
  const isInitialized = ref(false);

  // --- GETTERS ---
  const isAuthenticated = computed(() => !!session.value);
  const userEmail = computed(() => user.value?.email ?? null);
  const userId = computed<string | null>(() => user.value?.id ?? null);

  /**
   * runFullInitialization
   * The critical sequence that must succeed for the app to be 'ready'.
   * 1. Settings hydration
   * 2. Transaction fetching
   */
  async function runFullInitialization() {
    if (isInitialized.value) return;

    try {
      isInitialized.value = true;

      const settingsStore = useSettingsStore();
      await settingsStore.loadSettings();

      const transactionStore = useTransactionStore();
      await transactionStore.fetchTransactions();

      // Success is logged by the component/view calling this, or observed via state.
    } catch (error) {
      isInitialized.value = false; // Allow retry on failure
      throw error; // Propagate to caller
    }
  }

  /**
   * initializeAuth
   * Sets up the session and the persistent listener for auth state changes.
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

      if (initialSession?.user) {
        posthog.identify(initialSession.user.id, {
          email: initialSession.user.email,
        });
        await runFullInitialization();
      }

      // Listener for Login/Logout/Refresh events.
      // The callback is not awaited by Supabase, so errors cannot propagate to a
      // caller. Re-throwing from the async callback surfaces them as unhandled
      // rejections, which are caught by the global handler registered in main.ts.
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        const oldUserId = user.value?.id;
        session.value = newSession;
        user.value = newSession?.user ?? null;

        if (newSession?.user) {
          if (newSession.user.id !== oldUserId) {
            posthog.identify(newSession.user.id, {
              email: newSession.user.email,
            });
          }

          if (event === "SIGNED_IN") {
            await runFullInitialization();
          }
        } else if (event === "SIGNED_OUT") {
          // Reset all user-specific state on sign-out
          posthog.reset();
          isInitialized.value = false;

          const transactionStore = useTransactionStore();
          transactionStore.transactions = [];

          const settingsStore = useSettingsStore();
          settingsStore.restoreDefaults();
        }
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * signOut
   * Ends the Supabase session. Cleanup is handled by the onAuthStateChange listener.
   */
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Local state clear as a secondary safety measure
    user.value = null;
    session.value = null;
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    userEmail,
    userId,
    isInitialized,
    initializeAuth,
    signOut,
  };
});
