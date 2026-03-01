// @/composables/useAnalytics.ts
import posthog from "posthog-js";

/**
 * useAnalytics
 * Composable wrapper for PostHog event tracking.
 */
export function useAnalytics() {
  /**
   * track
   * Captures a custom event with optional metadata.
   * @param event - The name of the event (e.g., 'transaction_created')
   * @param props - Additional data to send with the event
   */
  function track(event: string, props?: Record<string, unknown>) {
    posthog.capture(event, props);
  }

  return { track };
}
