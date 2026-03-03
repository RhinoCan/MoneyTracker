import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./tests/setup.ts"],
      exclude: ["**/node_modules/**", "**/tests/e2e/**"],  // ← belongs here, at the test level
      // Coverage configuration
      coverage: {
        provider: "v8",
        include: ["src/**"],
        exclude: [
          "src/plugins/**",
          "src/main.ts",
          "src/types/**",
          "**/*.d.ts",
          "src/main.js",
        ],
        reporter: ["text", "json", "html"],
      },
      // The "deps" block for Vuetify support
      server: {
        deps: {
          inline: ["vuetify", "posthog-js", "@sentry/vue"],
        },
      },
    },
  })
);