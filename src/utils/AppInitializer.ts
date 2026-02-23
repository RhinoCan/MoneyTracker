import { supabase } from "@/lib/supabase";
import { useSettingsStore } from "@/stores/SettingsStore"; // The new source of truth
import { useUserStore } from "@/stores/UserStore";
import { logException, logInfo } from "@/lib/Logger";
import { i18n } from "@/i18n";

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
      const record = data[0] as any;

      settingsStore.locale = record.locale_value;
      settingsStore.currency = record.currency_value;
      settingsStore.snackbarTimeout = record.timeout_value;

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