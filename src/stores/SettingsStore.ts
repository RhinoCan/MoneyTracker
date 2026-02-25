// @/stores/SettingsStore.ts
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/supabase";
import { useUserStore } from "@/stores/UserStore";
import { logException, logSuccess } from "@/lib/Logger";
import { i18n } from "@/i18n";
import type { SupportedCurrency, SupportedLocale } from "@/types/CommonTypes";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (i18n.global as any).t;
export type SettingsRow = Database["public"]["Tables"]["system_settings"]["Row"];
type SettingsInsert = Database["public"]["Tables"]["system_settings"]["Insert"];

// Locale to default currency mapping
export const localeToCurrency: Record<SupportedLocale, SupportedCurrency> = {
  "en-US": "USD",
  "en-CA": "CAD",
  "en-GB": "GBP",
  "fr-FR": "EUR",
  "fr-CA": "CAD",
  "fr-CH": "CHF",
  "es-ES": "EUR",
  "de-DE": "EUR",
  "zh-CN": "CNY",
  "ja-JP": "JPY",
  "ko-KR": "KRW",
  "hi-IN": "INR",
  "ar-SA": "SAR",
  "ru-RU": "RUB",
  "pt-BR": "BRL",
  "it-IT": "EUR",
};

export const useSettingsStore = defineStore("settingsStore", () => {
  const userStore = useUserStore();

  // --- State ---
  const locale = ref<SupportedLocale>("en-US");
  const currency = ref<SupportedCurrency>("USD");
  const messageTimeoutSeconds = ref<number>(-1); // Persist until manual close
  const isLoading = ref(false);

  // --- Watchers ---

  // Update i18n and HTML lang attribute when locale changes
  watch(
    locale,
    (newVal) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (i18n.global as any).locale.value = newVal; // See i18n.global comment above
      document.querySelector("html")?.setAttribute("lang", newVal);
    },
    { immediate: true }
  );

  // --- Actions ---

  /**
   * Resets local state to your defined default values.
   */
  function restoreDefaults() {
    locale.value = "en-US";
    currency.value = "USD";
    messageTimeoutSeconds.value = -1;
  }

  /**
   * Loads settings from Supabase.
   */
  async function loadSettings() {
    if (!userStore.userId) return;
    isLoading.value = true;
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("user_id", userStore.userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const record = data as SettingsRow;
        locale.value = record.locale_value as SupportedLocale;
        // Note: currency will auto-update via the locale watcher
        // But we still load it in case user manually changed it
        currency.value = record.currency_value as SupportedCurrency;
        messageTimeoutSeconds.value = record.timeout_value;
      } else {
        await saveToDb();
      }
    } catch (error) {
      logException(error, { module: "SettingsStore", action: "loadSettings" });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Persists current state to the database.
   * Uses double-casting to bypass 'never' type-resolution issues.
   */
  async function saveToDb() {
    if (!userStore.userId) return;
    isLoading.value = true;

    const payload: SettingsInsert = {
      user_id: userStore.userId,
      locale_value: locale.value,
      currency_value: currency.value,
      timeout_value: messageTimeoutSeconds.value,
    };

    try {
      // NOTE: The 'as any' cast on supabase.from() is intentional.
      // Supabase's TypeScript client collapses chained query builder return types to 'never'
      // when using a typed Database schema. This is a known limitation of @supabase/supabase-js
      // (see github.com/supabase/supabase-js). The cast is safe because the Database type
      // in supabase.ts fully defines the expected shape of all data returned from these queries.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("system_settings") as any).upsert(payload as any, { // Double-cast required; see function JSDoc above
        onConflict: "user_id",
      });

      if (error) throw error;
      logSuccess(t("settingsStore.updated"), { module: "SettingsStore", action: "saveToDb" });
    } catch (error) {
      logException(error, { module: "SettingsStore", action: "saveToDb" });
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Deletes settings from DB and resets local state.
   */
  async function clearFromDb() {
    if (!userStore.userId) return;
    isLoading.value = true;
    try {
      // NOTE: The 'as any' cast on supabase.from() is intentional.
      // Supabase's TypeScript client collapses chained query builder return types to 'never'
      // when using a typed Database schema. This is a known limitation of @supabase/supabase-js
      // (see github.com/supabase/supabase-js). The cast is safe because the Database type
      // in supabase.ts fully defines the expected shape of all data returned from these queries.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("system_settings") as any)
        .delete()
        .eq("user_id", userStore.userId);

      if (error) throw error;

      restoreDefaults();
      logSuccess(t("settingsStore.cleared"), { module: "SettingsStore", action: "clearFromDb" });
    } catch (error) {
      logException(error, { module: "SettingsStore", action: "clearFromDb" });
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    locale,
    currency,
    messageTimeoutSeconds: messageTimeoutSeconds,
    isLoading,
    loadSettings,
    saveToDb,
    restoreDefaults,
    clearFromDb,
  };
});
