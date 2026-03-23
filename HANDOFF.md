# MoneyTracker — Session Handoff Document
**Date:** March 21, 2026

---

## Work Completed This Session

### Unit Test Fixes (all 612 passing)

- **`tests/stores/UserStore.spec.ts`** — fixed `vi.mock` hoisting error (`mockRouterPush is not defined`). Moved `vi.mock("@/router", ...)` to top level with `vi.fn()` inside the factory; used `vi.mocked()` inside the test to get a reference. 36/36 passing, 100% coverage on `UserStore.ts`.
- **`tests/router/index.spec.ts`** — two tests (`allows access to reset-password when authenticated` and `redirects away from forgot-password to home when authenticated`) were accidentally nested inside the `"unauthenticated user (no session)"` describe block. Moved them into `"authenticated user (active session)"`. 16/16 passing, 98.87% coverage on `router/index.ts`.
- **`tests/components/TrackerHeader.spec.ts`** — stale test assertion: `does not redirect if signOut throws` was testing old behaviour. Updated description to `redirects to login even if signOut throws` and flipped assertion to `toHaveBeenCalledWith("/login")` to match the intentional change from the previous session. 612/612 passing.

### Playwright Tests — `tests/e2e/forgotPassword.spec.ts` (new file)

Written from scratch covering:

**Forgot Password page:**
- Rendering (title, instruction, email field, buttons)
- Navigation (Back to Login, unauthenticated access allowed)
- Validation (empty email shows error, stays on page)
- Submission (valid email → success snackbar → redirect to login) — **see rate limit note below**
- Accessibility audit (axe)

**Reset Password page — invalid token state:**
- Rendering (title, invalid token message, Back to Login button, no password fields)
- Navigation (Back to Login)
- Accessibility audit (axe)

**Note on happy path:** The reset password happy path (valid token → set new password → redirect to login) cannot be e2e tested without intercepting email delivery (e.g. Inbucket/Mailpit in self-hosted Supabase). Documented with a comment in the spec file.

### Bug Fixes
- **`src/pages/ResetPassword.vue`** — added `bg-white` class to `v-card` to fix a genuine WCAG AA color contrast failure (contrast ratio 1.14, expected 3:1 for the title; 1.09, expected 4.5:1 for the invalid token paragraph) against the grey page background.
- **`tests/e2e/helpers.ts`** — added `forgotPassword` and `resetPassword` entries to the `ROUTES` constant.

### Supabase Rate Limiting — Important
The two Forgot Password submission tests (`accepts a valid email and shows success message` and `redirects to login after successful submission`) hit the real Supabase auth API. On the free tier, password reset emails are rate-limited to **2 per hour**. These tests were marked with `test.skip` to prevent them from exhausting the rate limit during full suite runs and causing cascade failures in other specs (particularly `locales.spec.ts` login attempts). They can be unskipped and run in isolation when specifically testing the submission flow.

---

## Outstanding Items

### High Priority
- **Full Playwright suite** — run `npx playwright test` after Supabase rate limit resets overnight. The 34 failures seen at end of session are login failures caused by Supabase rate limiting — repeated login attempts across 44 tests exhausted the limit. Do NOT run the suite again until morning. Run once fresh and assess the true baseline.
- **Accessibility tests for forgot password and reset password** — added to `forgotPassword.spec.ts` this session ✓
- **Translation keys** — `forgotPassword` and `resetPassword` keys still need adding to all 15 remaining locale files

### Medium Priority
- **Tamil (ta-IN) locale** — to be added once app is stable, for Meetup group member
- **i18n Meetup presentation** — pick up where we left off; remaining topics include `Intl` number/currency formatting demo and Temporal date examples

### Low Priority
- **Login page accessibility** — locale select in Settings has no accessible name issue was confirmed not applicable (Vuetify label prop handles it correctly)
- **Password visibility toggle tests** — uncovered branch in Login, ForgotPassword and ResetPassword (showPassword ternaries); not critical

---

## Sentry Replay — Fix Needed

Playwright tests triggered Sentry session replays, exhausting the free tier quota of 100 replays in a single day. Every test run was being recorded as a real user session.

**Fix — two steps:**

**Step 1:** Update `src/main.ts` — wrap replay in a Playwright check:

```typescript
Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN as string,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    ...(import.meta.env.VITE_PLAYWRIGHT ? [] : [Sentry.replayIntegration()]),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: import.meta.env.VITE_PLAYWRIGHT ? 0 : 0.1,
  replaysOnErrorSampleRate: import.meta.env.VITE_PLAYWRIGHT ? 0 : 1.0,
});
```

**Step 2:** Update `playwright.config.ts` — set the env variable when starting the dev server:

```typescript
webServer: {
  command: 'cross-env VITE_PLAYWRIGHT=true npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  stdout: 'ignore',
  stderr: 'pipe',
},
```

`cross-env` is already a project dependency. No new packages needed.

---

## Known Constraints
- Supabase free tier rate limits password reset emails to **2 per hour** — be mindful during testing; two submission tests in `forgotPassword.spec.ts` are skipped for this reason
- `Temporal.ZonedDateTime` cannot be passed to `Intl.DateTimeFormat` — use `toInstant()` workaround per TC39 designer's StackOverflow answer
- `SKIP_REGISTRATION_TEST=true` must be set when running Playwright via `run-playwright.bat` (already in batch file); remember to clear it if set as a system variable

---

## Coverage Summary (unit tests)
Overall: 99.28% statements, 93.93% branches
- `UserStore.ts` — 100%
- `router/index.ts` — 98.87% (line 82 uncovered, minor edge case)
- `ResetPassword.vue` — 100% statements, 81.25% branches (lines 33, 81, 119–123, 132–136 — password visibility toggle branches, low priority)
- `posthog.ts` — 0% (intentionally mocked everywhere)

---

## Next Session Priorities
1. Fix Sentry replay — apply the two-step fix above to `main.ts` and `playwright.config.ts`
2. Run full Playwright suite (`npx playwright test`) after rate limit resets overnight and confirm cascade failures are resolved
3. Add translation keys to all 15 remaining locale files
4. Continue i18n Meetup presentation work