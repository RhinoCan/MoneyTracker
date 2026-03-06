// @/plugins/vuetify.ts
import "vuetify/styles";
import { createVuetify, type ThemeDefinition } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VDateInput } from "vuetify/labs/VDateInput";
import { VuetifyDateAdapter } from "vuetify/date/adapters/vuetify";
// Vuetify's own internal UI strings (clear button, calendar labels, etc.)
import { en } from "vuetify/locale";

// 1. Define your custom light theme with a strict type
const light: ThemeDefinition = {
  dark: false,
  colors: {
    primary: "#00796B", // soft teal
    secondary: "#455A64", // blue-grey
    surface: "#F5F5F5", // light grey panels/cards
    background: "#FAFAFA",
    info: "#00796B", // lighter teal
    success: "#00695C", // desaturated teal
    warning: "#616161", // neutral grey
    error: "#C62828", // muted red
  },
};

export default createVuetify({
  locale: {
    locale: "en",
    fallback: "en",
    messages: { en },
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
    global: {
      // Note: 'font' isn't a standard Vuetify default property,
      // usually handled in CSS, but keeping it here for your config.
    },
  },
  theme: {
    defaultTheme: "light",
    themes: {
      light,
    },
  },
});
