<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useUserStore } from "@/stores/UserStore";
import { useSettingsStore } from "@/stores/SettingsStore";
import TrackerHeader from "@/components/TrackerHeader.vue";
import { useI18n } from "vue-i18n";
import { useLocale } from 'vuetify';

const { current: vuetifyLocale } = useLocale();
const { t, locale } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];
import { useNotificationStore } from "@/stores/NotificationStore";
const notificationStore = useNotificationStore();
const fatalError = ref(false);

watch(locale, (newLocale) => {
  const lang = newLocale.split('-')[0];
  const isRTL = RTL_LOCALES.includes(newLocale);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = newLocale;
  vuetifyLocale.value = newLocale;
}, { immediate: true });

watch(() => settingsStore.locale, (newLocale) => {
  vuetifyLocale.value = newLocale
}, { immediate: true })

/**
 * bootApp
 * Now that UserStore handles the full chain (Auth -> Settings -> Data),
 * simply calling initializeAuth() will handle everything.
 */
const bootApp = async () => {
  try {
    fatalError.value = false;
    // This now awaits Auth, Settings, and Transactions because of our UserStore changes!
    await userStore.initializeAuth();
  } catch (error) {
    fatalError.value = true;
    //logException already called in UserStore, no need to log again
  }
};

const retryInit = () => {
  window.location.reload();
};

onMounted(() => {
  bootApp();
});

</script>

<template>
  <v-app>
    <v-container v-if="fatalError" class="fill-height">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="4" class="text-center">
          <v-icon color="error" size="64">mdi-alert-octagon</v-icon>
          <h1 class="text-h5 mt-4">{{ t('app.fatalHeadline') }}</h1>
          <p class="text-body-1 mt-2 text-medium-emphasis">
            {{ t("app.noStart") }}
          </p>
          <v-btn color="primary" class="mt-4" @click="retryInit">
            {{ t("app.retry") }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <v-container v-else-if="userStore.loading" class="fill-height">
      <v-row justify="center" align="center">
        <v-progress-circular indeterminate color="primary" size="64" />
      </v-row>
    </v-container>

    <template v-else>
      <TrackerHeader />

      <v-main class="bg-grey-lighten-3">
        <v-container fluid>
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </v-container>
      </v-main>
    </template>

    <!--If the timeout value is any number greater than 0, it is a number of seconds and needs to be multiplied by
    1000 to be turned into milliseconds; if the timeout value is -1, it should not be multiplied so that Vuetify
    understands it to mean that it the snackbar needs to be persisted until the user closes it manually. -->
    <v-snackbar
      :key="notificationStore.snackbarKey"
      v-model="notificationStore.isVisible"
      :color="notificationStore.color"
      :timeout="settingsStore.snackbarTimeout === -1 ? -1 : settingsStore.snackbarTimeout * 1000"
    >
      {{ notificationStore.text }}

      <template v-slot:actions>
        <v-btn variant="text" @click="notificationStore.isVisible = false">
          {{ t("common.close") }}
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<style>
/* Smooth transition between routes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
