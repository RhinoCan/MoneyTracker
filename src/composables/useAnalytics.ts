// @/composables/useAnalytics.ts
import posthog from "posthog-js";

/**
 * useAnalytics
 * Composable wrapper for PostHog event tracking and page views.
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

  /**
   * page
   * Manually captures a page view. Useful for SPAs where navigation
   * doesn't trigger a full browser reload.
   * @param name - The name/path of the page
   * @param props - Additional data context
   */
  function page(name: string, props?: Record<string, unknown>) {
    posthog.capture("$pageview", {
      name,
      ...props
    });
  }

  return { track, page };
}
