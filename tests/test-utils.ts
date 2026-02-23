import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

function createTestVuetify() {
  return createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: "light",
      themes: {
        light: {
          colors: {
            primary: "#1976D2",
          },
        },
      },
    },
  });
}

export function mountWithVuetify(component: any, options: any = {}) {
  const vuetify = createTestVuetify();

  return mount(component, {
    global: {
      plugins: [vuetify],
      stubs: {
        VApp: { template: '<div class="v-application"><slot /></div>' },
        VMain: { template: "<main><slot /></main>" },
      },
      ...options.global,
    },
    ...options,
  });
}

export function mountWithPlugins(component: any, options: any = {}) {
  return mount(component, {
    global: {
      stubs: {
        VApp: true,
        VMain: true,
        VBtn: true,
        VCard: true,
      },
      ...options.global,
    },
    ...options,
  });
}
