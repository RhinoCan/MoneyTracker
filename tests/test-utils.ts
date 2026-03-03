// tests/test-utils.ts
import { createApp } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { i18n } from "@/i18n";

/**
 * withSetup
 * Executes a composable inside a minimal Vue app context.
 * Required for composables that call useI18n(), useRoute(), or other
 * Vue injection-based APIs that require an active component instance.
 *
 * @param composable - A function that calls and returns the composable result
 * @returns The return value of the composable
 *
 * @example
 * const { formatToMediumDate } = withSetup(() => useDateFormatter());
 */
export function withSetup<T>(composable: () => T): T {
  let result!: T;

  const pinia = createPinia();
  setActivePinia(pinia);

  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });

  app.use(pinia);
  app.use(i18n);
  app.mount(document.createElement("div"));

  return result;
}
