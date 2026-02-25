/* eslint-disable no-console */
import * as Sentry from "@sentry/vue";
import posthog from "posthog-js";
import { useNotificationStore } from "@/stores/NotificationStore";
import { i18n } from "@/i18n";

/**
 * Helper to get locale for Sentry/PostHog tagging.
 * Pulling directly from localStorage avoids circular dependencies with SettingsStore.
 */
const getCurrentLocale = () => localStorage.getItem("user-locale") || "en-US";

export type LoggerMeta = {
  module: string; // e.g., 'TransactionStore', 'AppInitializer'
  action: string; // e.g., 'addTransaction', 'loadSettings'
  slug?: string; // e.g., 'db.23505', 'err.validation_failed'
  data?: unknown; // Any relevant context (IDs, record counts, etc.)
  [key: string]: unknown;
};

/**
 * translateIfPossible
 * Helper to check if a string is a translation key.
 * If i18n has it, return the translation. Otherwise, return the original.
 */
// NOTE: logInfo and logWarning are developer-facing only (no snackbar).
// Their messages do not need to be translation keys.
// Only logSuccess, logException, and logValidation are user-facing
// and require translatable messages.
const translateIfPossible = (message: string): string => {
  // te() checks if the key exists in your JSON files
  if (i18n.global.te(message)) {
    return i18n.global.t(message);
  }
  return message;
};

/**
 * logException
 * USE CASE: Handled or unhandled errors that prevent a task from completing.
 * BEHAVIOR: Sentry (Error), PostHog (Event), Console (Red), Snackbar.
 * * EXAMPLE:
 * logException(error, {
 * module: 'TransactionStore',
 * action: 'addTransaction',
 * slug: 'db.constraint_violation',
 * data: { amount: 500 }
 * });
 * === logException is user-facing so translateable messages should be passed in the slug (or in the message if there is no actual exception) ===
 */
export const logException = (error: unknown, meta: LoggerMeta) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Logging - Developer-facing - English
  Sentry.withScope((scope) => {
    scope.setTag("locale", getCurrentLocale());
    if (meta.slug) scope.setTag("slug", meta.slug);
    scope.setExtras(meta);
    Sentry.captureException(error);
  });

  posthog.capture("exception", {
    message: errorMessage,
    ...meta,
    locale: getCurrentLocale(),
  });
  console.error(`🔴 [EXCEPTION] ${meta.module} > ${meta.action}:`, error, meta);

  // Notification - user-facing - localized
  const notify = useNotificationStore();
  const userMessage = meta.slug ? translateIfPossible(meta.slug) : errorMessage;
  notify.showMessage(userMessage, "error");
};

/**
 * logWarning
 * USE CASE: Unexpected behavior where the app can still function (fallbacks).
 * BEHAVIOR: Sentry (Warning), PostHog (Event), Console (Orange). No snackbar.
 * * EXAMPLE:
 * logWarning("User profile image failed to load, using placeholder", {
 * module: 'UserStore',
 * action: 'loadAvatar',
 * slug: 'warn.image_fallback'
 * });
 */
export const logWarning = (message: string, meta: LoggerMeta) => {
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setTag("locale", getCurrentLocale());
    scope.setExtras(meta);
    Sentry.captureMessage(message);
  });

  posthog.capture("warning", { message, ...meta, locale: getCurrentLocale() });
  console.warn(`🟠 [WARNING] ${meta.module} > ${meta.action}: ${message}`, meta);
};

/**
 * logValidation
 * USE CASE: User-facing form validation failures.
 * BEHAVIOR: PostHog (Event), Console (Yellow), Snackbar (warning color).
 * No Sentry — validation failures are expected user behavior, not application errors.
 * EXAMPLE:
 * logValidation("addTrans.wrongSeparator", {
 *   module: 'AddTransaction',
 *   action: 'onSubmit'
 * });
 * === logValidation is user-facing so translatable keys should be passed as message ===
 */
export const logValidation = (message: string, meta: LoggerMeta) => {
  posthog.capture("validation", { message, ...meta, locale: getCurrentLocale() });
  console.warn(`🟡 [VALIDATION] ${meta.module} > ${meta.action}: ${message}`, meta);

  const notify = useNotificationStore();
  notify.showMessage(translateIfPossible(message), "warning");
};

/**
 * logInfo
 * USE CASE: Background system pulses and read-only successes.
 * BEHAVIOR: PostHog (Event), Console (Blue). No Sentry, no snackbar.
 * * EXAMPLE:
 * logInfo("Settings hydrated from database", {
 * module: 'AppInitializer',
 * action: 'init',
 * data: { rowCount: 12 }
 * });
 */
export const logInfo = (message: string, meta: LoggerMeta) => {
  posthog.capture("info", { message, ...meta, locale: getCurrentLocale() });
  console.info(`🔵 [INFO] ${meta.module} > ${meta.action}: ${message}`, meta);
};

/**
 * logSuccess
 * USE CASE: Confirmed user-driven data changes (Mutations).
 * BEHAVIOR: PostHog (Event), Console (Green), Snackbar. No Sentry.
 * * EXAMPLE:
 * logSuccess("Transaction deleted successfully", {
 * module: 'TransactionStore',
 * action: 'deleteTransaction',
 * data: { id: 123 }
 * });
 * === logSuccess is user-facing so messages should be translated ===
 */
export const logSuccess = (message: string, meta: LoggerMeta) => {
  posthog.capture("success", { message, ...meta, locale: getCurrentLocale() });
  console.log(`🟢 [SUCCESS] ${meta.module} > ${meta.action}: ${message}`, meta);

  //Notification - user-facing - localized
  const notify = useNotificationStore();
  notify.showMessage(translateIfPossible(message), "success");
};
