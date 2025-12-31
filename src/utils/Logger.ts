import * as Sentry from "@sentry/vue";
import { useToast } from "vue-toastification";
import { useOtherStore } from "@/stores/OtherStore";

const toast = useToast();

/**
 * Private helper to get the timeout safely from the OtherStore.
 * We call it inside this function so Pinia is definitely ready.
 */
const getSafeTimeout = (): number => {
  try {
    const otherStore = useOtherStore();
    return otherStore?.getTimeout ?? 0;
  } catch {
    return 0; // Ultimate fallback if Pinia isn't ready
  }
};

export const logException = (error: unknown, context: { module: string; action: string; data?: any }) => {
  Sentry.captureException(error, { extra: { ...context } });

  if (import.meta.env.DEV) {
    console.error(`🔴 [${context.module} Error] at ${context.action}:`, error);
  }

  toast.error(`A technical error occurred in ${context.module}.`, {
    timeout: getSafeTimeout()
  });
};

export const logWarning = (message: string, context: { module: string; action: string; data?: any }) => {
  Sentry.captureMessage(message, { level: "warning", extra: { ...context } });

  if (import.meta.env.DEV) {
    console.warn(`🟠 [${context.module} Warning] at ${context.action}: ${message}`);
  }

  toast.warning(message, {
    timeout: getSafeTimeout()
  });
};

export function logInfo(message: string, context: {module: string; action: string; data?: any }) {
  // Logic to print to console (maybe blue 🔵)
  console.info(`🔵 [${context || 'Info'}] ${message}`, context);

  // If you use Sentry, you can send it as an 'info' level breadcrumb
  Sentry.addBreadcrumb({ category: 'info', message, level: 'info' });
}

/**
 * A new helper for your "Success" messages!
 * This lets you remove useToast from your stores entirely.
 */
export const logSuccess = (message: string) => {
  toast.success(message, {
    timeout: getSafeTimeout()
  });
};