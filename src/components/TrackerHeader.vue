<script setup lang="ts">
import { ref, computed } from "vue";
import Settings from "@/components/Settings.vue";
import DataManagement from "@/components/DataManagement.vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/stores/UserStore";
import { useRouter } from "vue-router";
import { logException } from "@/lib/Logger";

const { t } = useI18n();
const userStore = useUserStore();
const router = useRouter();

/**
 * Environment Detection
 * Checks VITE_APP_ENV directly (truthy = Live, falsy = Dev).
 * We compare the raw env var rather than the translated string so the
 * chip color remains correct in all locales.
 */
const isLive = computed(() => !!import.meta.env.VITE_APP_ENV);

const appEnvironment = computed(() => {
  return isLive.value ? t("header.textLive") : t("header.textDev");
});

async function handleLogout() {
  try {
    await userStore.signOut();
    router.push("/login");
  } catch (error) {
    logException(error, {
      module: "TrackerHeader",
      action: "handleLogout",
      slug: "header.logout_failed",
    });
  }
}

const showSettings = ref(false);
const showDataManagement = ref(false);
</script>

<template>
  <v-app-bar color="primary" elevation="2" density="comfortable">
    <v-app-bar-title class="font-weight-black text-uppercase letter-spacing-1">
      {{ t("header.title") }}
    </v-app-bar-title>

    <v-spacer />

    <v-chip
      :color="isLive ? 'success' : 'warning'"
      variant="elevated"
      size="small"
      class="mr-2 font-weight-bold"
    >
      {{ appEnvironment }}
    </v-chip>

    <div class="d-none d-md-flex align-center">
      <v-btn
        id="showSettings"
        data-testid="open-settings"
        color="yellow-lighten-2"
        variant="text"
        class="mr-1"
        @click="showSettings = true"
      >
        <v-icon start>mdi-cog</v-icon>
        {{ t("header.settings") }}
      </v-btn>

      <v-btn
        id="showDataManagement"
        data-testid="open-data-management"
        color="yellow-lighten-2"
        variant="text"
        class="mr-2"
        @click="showDataManagement = true"
      >
        <v-icon start>mdi-database-cog</v-icon>
        {{ t("header.data") }}
      </v-btn>
    </div>

    <div class="d-flex d-md-none">
      <v-btn icon="mdi-cog" data-testid="open-settings" color="yellow-lighten-2" @click="showSettings = true" />
      <v-btn icon="mdi-database-cog" data-testid="open-data-management" color="yellow-lighten-2" @click="showDataManagement = true" />
    </div>

    <v-divider vertical inset class="mx-2" />

    <div v-if="userStore.isAuthenticated" class="d-flex align-center">
      <span class="mr-3 d-none d-lg-inline text-caption opacity-80">
        {{ userStore.userEmail }}
      </span>
      <v-btn variant="outlined" size="small" color="white" data-testid="logoff" class="mr-2" @click="handleLogout">
        {{ t("header.logoff") }}
      </v-btn>
    </div>

    <v-dialog
      v-model="showSettings"
      max-width="550"
      persistent
      transition="dialog-bottom-transition"
    >
      <Settings @close="showSettings = false" />
    </v-dialog>

    <v-dialog
      v-model="showDataManagement"
      max-width="550"
      persistent
      transition="dialog-bottom-transition"
    >
      <DataManagement @close="showDataManagement = false" />
    </v-dialog>
  </v-app-bar>
</template>

<style scoped>
.letter-spacing-1 {
  letter-spacing: 1px;
}
:deep(.v-app-bar-title__placeholder) {
  overflow: hidden;
  white-space: nowrap;
  font-size: clamp(0.7rem, 1.8vw, 1rem);
}
</style>
