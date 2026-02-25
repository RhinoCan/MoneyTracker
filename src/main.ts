// @/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { i18n } from "./i18n/index";

// NOTE: The 'as any' cast on i18n.global is intentional.
// useI18n() requires a Vue component setup context and cannot be called outside of one.
// Accessing i18n.global directly is the correct pattern for translating strings outside
// of components. The cast is necessary because vue-i18n does not export a public type
// for the global composer object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const t = (i18n.global as any).t;

// 1. IMPORT GLOBAL CSS
import "./assets/style.css";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

// 2. IMPORT GLOBAL COMPONENTS
import TrackerHeader from "@/components/TrackerHeader.vue";

// Import your custom logger
import { logException } from "./lib/Logger";

// Create the Pinia instance first so we can export it
// This allows Logger.ts to use stores outside of components
export const pinia = createPinia();

import App from "./App.vue";

const app = createApp(App);

// THE GLOBAL SAFETY NET
app.config.errorHandler = (error, instance, info) => {
  logException(error, {
    module: "Global",
    action: "VueErrorHandler",
    slug: t("main.global_vue_crash"),
    data: { info }, // 'info' is a string describing the Vue hook
  });
};

// 3. REGISTER GLOBAL COMPONENTS
app.component("TrackerHeader", TrackerHeader);

// Initialize Plugins
app.use(pinia); // Use the exported instance
app.use(i18n);
app.use(router);
app.use(vuetify);

app.mount("#app");
