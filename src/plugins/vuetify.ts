// @/plugins/vuetify.ts
import "vuetify/styles";
import { createVuetify, type ThemeDefinition } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VDateInput } from "vuetify/labs/VDateInput";
import DateFnsAdapter from "@date-io/date-fns";
import { enUS } from "date-fns/locale";

// 1. Define your custom light theme with a strict type
const light: ThemeDefinition = {
  dark: false,
  colors: {
    primary: "#00897B", // soft teal
    secondary: "#455A64", // blue-grey
    surface: "#F5F5F5", // light grey panels/cards
    background: "#FAFAFA",
    info: "#26A69A", // lighter teal
    success: "#4DB6AC", // desaturated teal
    warning: "#BDBDBD", // neutral grey
    error: "#F44336", // muted red
  },
};

export default createVuetify({
  locale: {
    locale: "en",
    rtl: { ar: true, "ar-SA": true },
  },
  components: {
    ...components,
    VDateInput,
  },
  directives,
  date: {
    adapter: DateFnsAdapter,
    locale: {
      en: enUS,
    },
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
