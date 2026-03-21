// @/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { watch } from "vue";
import { i18n } from "./i18n/index";
import router from "./router";
import vuetify from "./plugins/vuetify";
import * as Sentry from "@sentry/vue";
import { initPosthog } from "./posthog";
import { logException } from "./lib/Logger";

import "./assets/style.css";
import "vuetify/styles";

import App from "./App.vue";
import TrackerHeader from "@/components/TrackerHeader.vue";


export const pinia = createPinia();

const app = createApp(App);

// 1. INITIALIZE POSTHOG
initPosthog();

// 2. INITIALIZE SENTRY
Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// 3. GLOBAL ERROR HANDLER
// The safety net for unhandled Vue errors and unhandled promise rejections
// (e.g. errors thrown from onAuthStateChange in UserStore).
app.config.errorHandler = (error, instance, info) => {
  logException(error, {
    module: "Global",
    action: "VueErrorHandler",
    slug: "main.global_vue_crash",
    data: { info },
  });
};

app.component("TrackerHeader", TrackerHeader);

app.use(pinia);
app.use(i18n);
app.use(router);
app.use(vuetify);

watch (i18n.global.locale, (newLocale) => {
  document.documentElement.lang = newLocale as string;
}, { immediate: true});

app.mount("#app");
