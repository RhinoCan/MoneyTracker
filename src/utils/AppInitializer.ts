import { supabase } from "@/lib/supabase";
import { useSettingsStore } from "@/stores/SettingsStore"; // The new source of truth
import { useUserStore } from "@/stores/UserStore";
import { logException, logInfo } from "@/lib/Logger";
import { i18n } from "@/i18n";
import type { SettingsRow } from "@/stores/SettingsStore";
import { SupportedLocale, SupportedCurrency } from "@/types/CommonTypes";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (i18n.global as any).t;

export async function initializeAppSettings() {
  const userStore = useUserStore();
  const settingsStore = useSettingsStore();
  const userId = userStore.userId;

  if (!userId) return;

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("locale_value, currency_value, timeout_value")
      .eq("user_id", userId);

    if (error) throw error;

    if (data && data.length > 0) {
      // --- HYDRATION PATH ---
      const record = data[0] as SettingsRow;

      settingsStore.locale = record.locale_value as SupportedLocale;
      settingsStore.currency = record.currency_value as SupportedCurrency;
      settingsStore.messageTimeoutSeconds = record.timeout_value;

      logInfo("SettingsStore hydrated from database", {
        module: "AppInitializer",
        action: "initializeAppSettings",
      });
    } else {
      // --- SEEDING PATH ---
      logInfo("No settings found, seeding defaults via SettingsStore...", {
        module: "AppInitializer",
        action: "initializeAppSettings",
      });

      // We use the saveToDb method already in your SettingsStore
      // It uses the default values defined in the store's refs
      await settingsStore.saveToDb();
    }
  } catch (err) {
    logException(err, {
      module: "AppInitializer",
      action: "initializeAppSettings",
      slug: t("appInit.hydration_failed"),
    });
  }
}
