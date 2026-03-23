import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import { useUserStore } from "@/stores/UserStore";
import { i18n } from "@/i18n";
import type { SupportedCurrency, SupportedLocale } from "@/types/CommonTypes";

export type SettingsRow = Database["public"]["Tables"]["system_settings"]["Row"];
type SettingsInsert = Database["public"]["Tables"]["system_settings"]["Insert"];

export const localeToCurrency: Record<SupportedLocale, SupportedCurrency> = {
  "en-US": "USD", "en-CA": "CAD", "en-GB": "GBP", "fr-FR": "EUR",
  "fr-CA": "CAD", "fr-CH": "CHF", "es-ES": "EUR", "de-DE": "EUR",
  "zh-CN": "CNY", "ja-JP": "JPY", "ko-KR": "KRW", "hi-IN": "INR",
  "ar-SA": "SAR", "ru-RU": "RUB", "pt-BR": "BRL", "it-IT": "EUR",
  "ta-IN": "INR"
};

export const useSettingsStore = defineStore("settingsStore", () => {
  const userStore = useUserStore();

  // --- STATE ---
  const locale = ref<SupportedLocale>("en-US");
  const currency = ref<SupportedCurrency>("USD");
  const messageTimeoutSeconds = ref<number>(-1);
  const isSyncing = ref(false);

  // --- WATCHERS (The Auto-Hydration for UI) ---
  watch(
    locale,
    (newLocale) => {
      // Accessing i18n.global directly is the correct pattern outside component setup.
      // The cast is necessary because vue-i18n does not export a public type for the
      // global composer object.
      (i18n.global as unknown as { locale: { value: string } }).locale.value = newLocale;
      const htmlElement = document.querySelector("html");
      if (htmlElement) {
        htmlElement.setAttribute("lang", newLocale);
      }
    },
    { immediate: true }
  );

  // --- ACTIONS ---

  // NOTE: The 'as any' cast on supabase.from() is intentional throughout this store.
  // Supabase's TypeScript client collapses chained query builder return types to 'never'
  // when using a typed Database schema. This is a known limitation of @supabase/supabase-js
  // (see github.com/supabase/supabase-js). The cast is safe because the Database type
  // in supabase.ts fully defines the expected shape of all data returned from these queries.

  /**
   * seedToDb
   * Internal helper to create the initial settings record for a new user.
   */
  async function seedToDb() {
    if (!userStore.userId) return;

    const payload: SettingsInsert = {
      user_id: userStore.userId,
      locale_value: locale.value,
      currency_value: currency.value,
      timeout_value: messageTimeoutSeconds.value,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("system_settings") as any).insert([payload]);
    if (error) throw error;
  }

  /**
   * loadSettings
   * HYDRATION: Fetches DB settings and populates local state.
   * If no settings exist, it triggers seedToDb.
   */
  async function loadSettings() {
    if (!userStore.userId) return;

    isSyncing.value = true;
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("user_id", userStore.userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // HYDRATION: Mapping DB columns back to Ref state
        const record = data as SettingsRow;
        locale.value = (record.locale_value as SupportedLocale) || "en-US";
        currency.value = (record.currency_value as SupportedCurrency) || "USD";
        messageTimeoutSeconds.value = record.timeout_value ?? -1;
      } else {
        // SEEDING: New user found, create their record
        await seedToDb();
      }
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * saveToDb
   * The primary write operation. Silent on success.
   */
  async function saveToDb() {
    if (!userStore.userId) return;

    isSyncing.value = true;
    const payload: SettingsInsert = {
      user_id: userStore.userId,
      locale_value: locale.value,
      currency_value: currency.value,
      timeout_value: messageTimeoutSeconds.value,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("system_settings") as any).upsert(payload, {
        onConflict: "user_id",
      });

      if (error) throw error;
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * clearFromDb
   * Deletes the current user's settings record from the database and restores local defaults.
   */
  async function clearFromDb() {
    if (!userStore.userId) return;

    isSyncing.value = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("system_settings") as any)
        .delete()
        .eq("user_id", userStore.userId);

      if (error) throw error;
      restoreDefaults();
    } finally {
      isSyncing.value = false;
    }
  }

  /**
   * restoreDefaults
   * Resets all settings state to their hardcoded default values.
   * Called on sign-out and after clearFromDb.
   */
  function restoreDefaults() {
    locale.value = "en-US";
    currency.value = "USD";
    messageTimeoutSeconds.value = -1;
  }

  return {
    locale,
    currency,
    messageTimeoutSeconds,
    isLoading: isSyncing,
    loadSettings,
    saveToDb,
    restoreDefaults,
    clearFromDb,
  };
});
