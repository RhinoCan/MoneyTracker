import { createApp } from 'vue';
import * as Sentry from "@sentry/vue";
import { createPinia } from 'pinia';
import 'vuetify/styles';
import vuetify from './plugins/vuetify';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import './assets/style.css';
import App from './App.vue';

const pinia = createPinia();

const app = createApp(App);

// 1. Plugins and Middleware
app.use(Toast);
app.use(pinia);
app.use(vuetify);

// 2. The Sentry Safety Net
Sentry.init({
  app,
  dsn: "https://48683e101fece76061d58d4504e34781@o4510590864457728.ingest.us.sentry.io/4510590866554880",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// 3. Kick off the app
app.mount('#app');
