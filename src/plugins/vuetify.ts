// @/plugins/vuetify.ts
import "vuetify/styles";
import { createVuetify, type ThemeDefinition } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VDateInput } from "vuetify/labs/VDateInput";
import { VuetifyDateAdapter } from "vuetify/date/adapters/vuetify";
import { createVueI18nAdapter } from "vuetify/locale/adapters/vue-i18n";
import { useI18n } from "vue-i18n";
import { i18n } from "@/i18n";

const light: ThemeDefinition = {
  dark: false,
  colors: {
    primary: "#00796B",
    secondary: "#455A64",
    surface: "#F5F5F5",
    background: "#FAFAFA",
    info: "#00796B",
    success: "#00695C",
    warning: "#616161",
    error: "#C62828",
    "on-success": "#1a3a35"
  },
};

export default createVuetify({
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
    rtl: { ar: true, "ar-SA": true },
  },
  components: {
    ...components,
    VDateInput,
  },
  directives,
  date: {
    adapter: VuetifyDateAdapter,
  },
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  defaults: {
    global: {},
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light,
    },
  },
});