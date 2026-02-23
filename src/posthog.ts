import posthog from "posthog-js";

export function initPosthog() {
  const key = import.meta.env.VITE_POSTHOG_KEY;

  if (!key) {
    console.warn("[PostHog] Missing VITE_POSTHOG_KEY");
    return;
  }

  posthog.init(key, {
    api_host: "https://app.posthog.com",
    autocapture: false, // YOU control events
    capture_pageview: false, // we’ll call it manually for SPA
  });
}

export { posthog };
