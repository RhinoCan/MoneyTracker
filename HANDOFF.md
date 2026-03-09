# MoneyTracker — Project Handoff Document

## Current Status

### Version
**1.7.5** — deployed to https://rhinocan.github.io/MoneyTracker/

### Unit Tests
- **562 tests passing** across 31 files
- **99.29% statement coverage**, **95.63% branch coverage**
- All passes complete and stable

### E2E Tests (Playwright)
- **44 tests** across 5 spec files, 0 skipped
- **Status: 44/44 passing — all green locally and in CI**
- Browser: Chromium only for local dev (Firefox/WebKit commented out in config)
- Run with: `npx playwright test --project=chromium` or `npm run test:e2e`
- View results: `npx playwright show-report`
- Run a single test: `npx playwright test --project=chromium <file> --grep "<partial test name>"`

### Visual QA (1.7.1)
Manual review across de-DE, fr-FR, ar-SA, ru-RU, pt-BR, en-US complete. No outstanding issues.

---

## Unit Test Coverage — Deliberate Skips

These lines are intentionally uncovered and should not be pursued:

| File | Lines | Reason |
|------|-------|--------|
| `posthog.ts` | 1–19 | Pure init call, no testable logic |
| `SystemDefaults.ts` | 6–38, 57–58 | Module-level constants; Intl behaviour not instrumentable |
| `router/index.ts` | 72 | V8 instrumentation quirk with router singleton |
| `useAppValidationRules.ts` | 80 | V8 branch instrumentation quirk; statement is covered |
| `SettingsStore.ts` | 57–68 | `seedToDb` private guard — unreachable from public API |
| Components/Pages low function % | various | Vuetify SFC instrumentation artifact; statement coverage is 100% |

---

## E2E Test Suite — File Structure

```
tests/e2e/
  helpers.ts                — shared login/logout/openSettings/addTransaction etc.
  auth.spec.ts              — login, logout, register flows
  transactions.spec.ts      — add, update, delete transactions
  locales.spec.ts           — locale switching, RTL (Arabic), format hints
  dataManagement.spec.ts    — export CSV, delete transactions, restore settings
  accessibility.spec.ts     — axe-core accessibility checks (complete, 10/10)
```

### Key Design Decisions

- **workers: 1** — tests run serially, not in parallel (Supabase state shared across tests)
- **test.setTimeout(60000)** on locales.spec.ts and accessibility.spec.ts
- **`data-testid` attributes** are the standard approach for all interactive elements to avoid locale-dependent selectors
- **Dialog close pattern**: always wait for `getByRole('dialog').not.toBeVisible()` + `waitForTimeout(300)` after closing any Vuetify dialog to let the scrim animation fully clear
- **Vuetify v-select**: must be clicked via `page.locator('[data-testid="locale-select"]').click()` — clicking the inner input directly is unreliable
- **Locale-dependent UI**: after switching locale, ALL button labels and text change language. Always use `data-testid` for anything clicked after a locale change — never rely on text labels or role+name selectors

### Accessibility Spec — Known Vuetify Rule Suppressions
Three axe rules are suppressed in `accessibility.spec.ts` due to Vuetify internal rendering issues that cannot be fixed without patching Vuetify itself:
- **`aria-allowed-attr`** — date picker activator input renders with `aria-expanded` which is not valid on `type="text"`
- **`aria-tooltip-name`** — `v-tooltip` overlay renders a `div[role="tooltip"]` without an accessible name
- **`aria-progressbar-name`** — `v-data-table` loading spinner renders a `role="progressbar"` without an accessible name

All suppressions are applied via `.disableRules([...])` in `runAxe()`.

---

## Date Picker — v-date-input Migration (Complete)

Both `AddTransaction.vue` and `UpdateTransaction.vue` have been migrated from the old `v-menu` + `v-date-picker` pattern to the new `v-date-input` Vuetify labs component.

### Benefits
- Eliminates the `aria-allowed-attr` axe violation (the old date picker activator input had invalid `aria-expanded`)
- Single component instead of `v-menu` + `v-date-picker` + `v-text-field`
- Locale-aware date display automatically (e.g. `06.03.2026` in de-DE)
- Calendar icon rendered inside the field with `prepend-icon=""` + `prepend-inner-icon="mdi-calendar"`

### onDateSelected behaviour
When `null` is passed (user clears the field), `transaction.date` is set to `""` which triggers the existing `dateRequired` validation rule. The field does not silently reset to today.

### Removed from both components
- `v-menu`, `v-date-picker`, activator `v-text-field` for date
- `formattedDisplayDate` computed property
- `dateMenu` and `closeDatePicker` from `useTransactionFormFields` destructure
- `formatToMediumDate` from `useDateFormatter` import (still used elsewhere — do not remove from the composable)

---

## data-testid Inventory

| Element | Component | data-testid |
|---------|-----------|-------------|
| Settings button (desktop) | TrackerHeader.vue | `open-settings` |
| Settings button (mobile) | TrackerHeader.vue | `open-settings` |
| Data Management button (desktop) | TrackerHeader.vue | `open-data-management` |
| Data Management button (mobile) | TrackerHeader.vue | `open-data-management` |
| Logoff button | TrackerHeader.vue | `logoff` |
| Save Changes button | Settings.vue | `settings-save` |
| Cancel button | Settings.vue | `settings-cancel` |
| Locale v-select | Settings.vue | `locale-select` |
| Description field | AddTransaction.vue | `description-field` |
| Expense radio | AddTransaction.vue | `expense-radio` |
| Income radio | AddTransaction.vue | `income-radio` |
| Amount field | AddTransaction.vue | `amount-field` |
| Add Transaction button | AddTransaction.vue | `add-transaction-btn` |
| Reset button | AddTransaction.vue | `reset-btn` |
| Update button (row) | TransactionHistory.vue | `update-btn` |
| Delete button (row) | TransactionHistory.vue | `delete-btn` |
| Confirm delete button | DeleteTransaction.vue | `confirm-delete-btn` |
| Update Transaction button | UpdateTransaction.vue | `update-transaction-btn` |
| Cancel update button | UpdateTransaction.vue | `cancel-update-btn` |
| Export CSV button | DataManagement.vue | `export-csv-btn` |
| Delete All Transactions button | DataManagement.vue | `delete-all-transactions-btn` |
| Restore All Settings button | DataManagement.vue | `restore-settings-btn` |
| Delete Everything button | DataManagement.vue | `delete-everything-btn` |
| Password field | Login.vue | `password-field` |
| Password field | Register.vue | `password-field` |
| Confirm Password field | Register.vue | `confirm-password-field` |

---

## Dependencies

### Removed Packages
| Package | Reason removed |
|---------|---------------|
| `@fontsource/roboto` | Replaced by Google Fonts CDN link in `index.html` |
| `vue-toastification` | Replaced by the custom `NotificationStore` snackbar system |
| `date-fns` | Not used — Vuetify date picker uses `VuetifyDateAdapter` (built-in) |
| `@date-io/date-fns` | Not used — Vuetify date picker uses `VuetifyDateAdapter` (built-in) |

### Utility Scripts
- `scripts/add-locale-keys.mjs` — bulk-adds translation keys to all 16 locale files. Update the `ADDITIONS` object and run with `node scripts/add-locale-keys.mjs`. Safe to re-run — skips keys that already exist.

---

## Known App Bugs Fixed

### Arabic locale `currencyParser` (ar-SA)
**Root cause:** JavaScript's `\d` regex character class only matches ASCII digits 0–9. `ar-SA` formats numbers using Eastern Arabic-Indic digits (U+0660–U+0669). **Fix:** digit normalization added as step 2 in `parseCurrency`.

### Bug 1 — Wrong icon in `KeyboardShortcuts.vue` `#iconHelp` slot
Renamed slot to `#iconCancel`, changed icon to `mdi-close`, added `role="img"`. Also updated `aria-label` from `common.help` to `common.close`.

### Bug 2 — Escape key did not close the `UpdateTransaction` dialog
`persistent` outer dialog absorbed Escape before it could reach inner elements. Fixed by adding `@keydown.esc="closeDialog"` to the `v-card` inside the outer dialog.

### Bug 3 — Escape key did not reset the `AddTransaction` form
Fixed by adding `@keydown.esc="resetForm"` to the `v-form` element.

---

## Settings Dialog — Live Locale Preview (Option A)

The Settings dialog previews the selected locale immediately when the user picks a new value from the dropdown, before pressing Save. If the user cancels, the locale reverts to the last saved value.

---

## Icon Usage Convention

Icons were inconsistently applied throughout the app (Gemini's doing). The current agreed convention:

- **Form fields** — icons only where they aid recognition: date (calendar), email (envelope), password (lock), search (magnify). No icons on description or amount fields.
- **Buttons** — icons on destructive actions (delete, export) and confirmation actions (update, save) where they reinforce the nature of the action.
- **Dialog titles** — icons only where they convey type or severity beyond what the text alone signals (e.g. delete warning, keyboard shortcuts). UpdateTransaction title icon was removed.

---

## Phase 3: Accessibility — Complete

### Component Audit Status

| Component | Audited | Issues Found |
|-----------|---------|--------------|
| `AccountSummary.vue` | ✅ | 3 issues — all fixed |
| `TrackerHeader.vue` | ✅ | 4 issues — all fixed |
| `AddTransaction.vue` | ✅ | 2 issues — all fixed; date picker migrated to v-date-input |
| `Settings.vue` | ✅ | 2 issues found in axe run — fixed |
| `UpdateTransaction.vue` | ✅ | 3 issues — all fixed; date picker migrated to v-date-input |
| `DeleteTransaction.vue` | ✅ | 1 issue fixed; `<dl>` layout deferred |
| `KeyboardShortcuts.vue` | ✅ | 2 issues + 3 bugs — all fixed |
| `InfoIcon.vue` | ✅ | 1 issue fixed; `role="button"` low risk |
| `DataManagement.vue` | ✅ | 2 issues fixed; heading hierarchy low priority |
| `TransactionHistory.vue` | ✅ | 4 issues — all fixed |
| `TrackerAbout.vue` | ✅ | 1 accessibility fix + 1 bug fix |
| `Amount.vue` | ✅ | No issues |
| `Home.vue` | ✅ | No issues |
| `App.vue` | ✅ | 1 issue fixed |
| `Login.vue` | ✅ | 2 issues fixed; password visibility toggle added |
| `Register.vue` | ✅ | 2 issues fixed; password visibility toggle + confirm password field added |

### Fixes Applied This Phase

**`AccountSummary.vue`**
- Added `:aria-label="t('accountSummary.title')"` to `<table>`
- Changed label `<td>` elements to `<th scope="row">`
- Added `aria-hidden="true"` to divider row

**`TrackerHeader.vue`**
- Added `:aria-label` to mobile icon-only Settings and Data Management buttons
- Added `aria-hidden="true"` to decorative `v-divider`
- Added `aria-labelledby` to Settings and Data Management dialogs

**`AddTransaction.vue`**
- Added `@keydown.esc="resetForm"` to `v-form`
- Added `aria-labelledby` to KeyboardShortcuts dialog
- Migrated date picker from `v-menu` + `v-date-picker` to `v-date-input`

**`Settings.vue`**
- Added `id="settings-dialog-title"` to `v-card-title`
- Added `:aria-label="t('settings.timeoutSlider')"` to `v-slider`
- Added `:aria-label="t('common.saveChanges')"` to Save button

**`UpdateTransaction.vue`**
- Added `@keydown.esc="closeDialog"` to `v-card`
- Added `id="update-transaction-dialog-title"` to `v-card-title`
- Added `aria-labelledby` to both dialogs
- Added `closeKeyboardShortcuts()` function
- Added `:isDialog="true"` prop to `KeyboardShortcuts`
- Removed title icon (`mdi-pencil-box-outline`)
- Migrated date picker from `v-menu` + `v-date-picker` to `v-date-input`

**`DeleteTransaction.vue`**
- Added `id="delete-transaction-dialog-title"` to `v-card-title`
- Added `aria-labelledby` to dialog

**`KeyboardShortcuts.vue`**
- Fixed `#iconHelp` → `#iconCancel`, `mdi-help` → `mdi-close`, added `role="img"`
- Added `isDialog` prop to switch between `keyboard.paraEsc` and `keyboard.paraEscDialog`

**`InfoIcon.vue`**
- Added `useI18n` and replaced hardcoded `'Information'` fallback with `t('common.information')`

**`DataManagement.vue`**
- Added `:aria-label="t('common.close')"` to title bar close button
- Added `id="data-management-dialog-title"` to `v-card-title`
- Removed dead `|| "Danger Zone"` fallback

**`TransactionHistory.vue`**
- Added `aria-label` to four pagination buttons
- Added `:aria-label` to items-per-page `v-select`
- Added `:aria-label="column.title"` to sort icons
- Added `aria-hidden="true"` to transaction type `v-chip`
- Added `:loading-text="t('history.loading')"` to `v-data-table`

**`TrackerAbout.vue`**
- Added `rel="noopener noreferrer"` to external link
- Fixed `maincard=width` typo to `maincard-width`

**`App.vue`**
- Added `:aria-label="t('app.loading')"` to `v-progress-circular`

**`Login.vue`**
- Replaced `@click="handleLogin"` with `type="submit"` on button
- Added password visibility toggle (`showPassword` ref, eye/eye-off icon, `data-testid="password-field"`)

**`Register.vue`**
- Moved Register button inside `v-form`
- Replaced `@click="handleRegister"` with `type="submit"`
- Added password visibility toggle (`showPassword` ref, eye/eye-off icon, `data-testid="password-field"`)
- Added confirm password field with real-time mismatch validation (`data-testid="confirm-password-field"`)
- Added NIST-aligned password length rules (min 8, max 128 characters)
- Added demonstration disclaimer (`register.caution`) below Sign Up button

### New i18n Keys Added This Phase

| Key | Notes |
|-----|-------|
| `keyboard.paraEscDialog` | 16 locale files — dialog-specific Escape description |
| `keyboard.paraEsc` | Updated in 16 locale files — form-specific wording |
| `common.information` | 16 locale files |
| `history.ariaFirstPage` | 16 locale files |
| `history.ariaPrevPage` | 16 locale files |
| `history.ariaNextPage` | 16 locale files |
| `history.ariaLastPage` | 16 locale files |
| `settings.timeoutSlider` | 16 locale files |
| `app.loading` | 16 locale files |
| `history.loading` | 16 locale files |

### Known Vuetify Accessibility Limitations
These axe rules are suppressed in `accessibility.spec.ts` — unfixable without patching Vuetify 3:
- **`aria-allowed-attr`** — date picker input renders with invalid `aria-expanded`
- **`aria-tooltip-name`** — tooltip overlay renders without accessible name
- **`aria-progressbar-name`** — `v-data-table` loading spinner renders without accessible name

---

## Remaining Work

### All Phases Complete ✅
- Unit tests: 562/562 passing
- E2E tests: 44/44 passing locally and in CI
- Accessibility tests: 10/10 passing
- Visual QA: complete across 6 locales

### Optional Enhancements
- **Playwright auth state caching** — currently each test authenticates fresh against Supabase

---

## Key Tips for Future Sessions

### Unit Testing
1. Always `cat` files with line numbers before writing tests
2. For `Intl.NumberFormat` mocks — always use `vi.spyOn` + `spy.mockRestore()`
3. For store error branches — use `.mockResolvedValueOnce({ error: {...} })`
4. For `deleteTransaction`/`deleteAllTransactions` — do NOT set up `eq` mocks in `beforeEach`
5. `vi.unmock("@/lib/Logger")` in `Logger.spec.ts` must remain the very first line
6. Request full file contents before regenerating any spec file
7. When a source file gains new properties on a type, search for all spec files that assert against that type
8. When a component is refactored (e.g. date picker swap), check all spec files for tests against removed computed properties or state variables

### E2E Testing
9. Vuetify dialogs leave a `.v-overlay__scrim` that blocks clicks — always wait for dialog to be fully gone
10. Always use `data-testid` after a locale change — never rely on text labels
11. `row.locator('.v-chip', { hasText: /expense/i })` is the correct way to assert transaction type
12. The Playwright HTML report is far more useful than terminal output for debugging
13. To inspect Vuetify dropdown DOM: use `setTimeout(() => { console.log(...) }, 3000)` in console
14. TrackerHeader.vue has TWO buttons each for Settings and Data Management — always use `.first()`
15. `openSettings` and `openDataManagement` use `expect(page.getByRole('dialog')).toBeVisible()`
16. `selectLocale` scopes option lookup inside `page.getByRole('listbox')`
17. `addTransaction` uses `.first()` on the final cell assertion
18. All DataManagement.vue action buttons have `data-testid` — always use these
19. `window.confirm()` handlers must use `page.on('dialog', d => d.accept())` registered BEFORE the click
20. The nuclear option calls `window.location.reload()` — follow with `page.waitForLoadState('networkidle')`
21. Export CSV button is disabled when no transactions exist
22. Vuetify nested dialogs: Escape is captured by outermost `persistent` dialog — wire `@keydown.esc` explicitly on inner elements
23. Settings dialog previews locale changes live (Option A) — Cancel reverts, Save commits
24. `accessibility.spec.ts` uses `requiresLogout` flag to skip logout in `afterEach` for logged-out page tests
25. Three axe rules suppressed due to Vuetify internals: `aria-allowed-attr`, `aria-tooltip-name`, `aria-progressbar-name`
26. In accessibility spec, scope Help button clicks to `[role="dialog"].first()` to avoid strict mode violation when two dialogs are open
27. Always wrap `runAxe()` in try/finally to ensure dialogs are closed even when axe finds violations — otherwise logout in `afterEach` will hang and time out

### Vuetify v-date-input
28. Use `prepend-icon=""` to suppress the outer icon, `prepend-inner-icon="mdi-calendar"` for inner icon
29. `v-date-input` manages its own open/close state — do not call `closeDatePicker()` from the update handler
30. When `null` is passed to the update handler, set `transaction.date = ""` to trigger validation rather than silently resetting to today
31. `v-date-input` is a Vuetify labs component — stub it as `"v-date-input": true` in unit tests, then assert presence via `wrapper.html().toContain('v-date-input')` or `document.body.innerHTML.toContain('v-date-input')` for teleported components
32. Use `:display-format="(date: unknown) => formatToMediumDate(formatToIsoDateOnly(date as Date))"` to match medium date format used elsewhere in the app

### Visual QA / i18n
33. French and German are the best locales for catching truncation — French runs ~25% longer than English, German compounds words
34. ar-SA RTL: mixing LTR text into Arabic text fields causes bidi cursor confusion — browser-level issue, not an app bug
35. Vuetify applies `white-space: nowrap` on `.v-btn__content` span internally — to allow button text to wrap you must target that inner span, not just the outer button
36. `v-card-title` needs `white-space: normal; height: auto; line-height: 1.4` in global CSS to prevent long translated titles from truncating
37. `v-card-actions` needs `flex-wrap: wrap; gap: 8px` to prevent buttons from clipping on narrow screens in long-text locales
38. Always use `:not(.v-btn--icon)` when applying `height: auto` to buttons — icon buttons must stay circular

### General
39. `scripts/add-locale-keys.mjs` — use this for all future bulk i18n key additions across 16 locale files
40. fr-FR, fr-CA, fr-CH locale files have been properly retranslated with genuine dialect variations
41. `TrackerHeader.vue` is registered globally in `main.ts` rather than imported in `App.vue`
42. Vuetify renders label colors via opacity on a parent element (`.v-field__input`) not as a direct color — override with `.v-field__input { opacity: 1 !important }` in global CSS
43. Vuetify theme colors changed for WCAG AA compliance — primary `#00796B`, success/info `#00695C`, warning `#616161`, error `#C62828`
44. Success snackbar text must be white (`#ffffff`) not black — `#000000` on `#00695C` only gives 3.17:1, white gives 5.33:1
45. `App.vue` fatal error screen uses `role="alert"` for dynamic appearance announcement to screen readers
46. Password visibility toggle: use `:append-inner-icon` and `:type="showPassword ? 'text' : 'password'"` on `v-text-field` — adding `aria-label` to the toggle button causes `getByLabel(/password/i)` to match 2 elements in Playwright; always use `data-testid` on password fields instead
47. Supabase auto-confirms and auto-logs-in new accounts when email confirmation is disabled — `signUp` triggers the session watcher in `App.vue` and redirects to home, bypassing `router.push({ name: 'login' })`. The `register` helper in `helpers.ts` accepts either `/login` or home URL for this reason
48. NIST SP 800-63B recommends minimum 8 characters, maximum 64+ characters, and NO complexity rules (no required uppercase/numbers/symbols) — password rules enforced on Register only, not Login, to avoid blocking existing accounts
49. `.v-card-title` needs `color: rgba(0,0,0,0.87) !important` in global CSS — on Login/Register pages the card sits on `bg-grey-lighten-4` (#f0f0f0) which is lighter than the main surface color, causing inherited title color to fail contrast
50. `.text-medium-emphasis` needs `color: #616161 !important; opacity: 1 !important` in global CSS — the CSS variable `--v-medium-emphasis-opacity` alone does not win on all pages
51. Vuetify's internal translation keys (e.g. `$vuetify.input.clear`, `$vuetify.input.appendAction`) must be provided via `createVueI18nAdapter` in `vuetify.ts` — import per-locale strings from `vuetify/locale` and merge them under `$vuetify` in each locale's messages in `i18n/index.ts`. Hindi (`hi`) is not available in Vuetify's locale exports — use English (`en`) as fallback
52. MDI icons should be loaded via CDN in `index.html` only — do not also import `@mdi/font/css/materialdesignicons.css` in `main.ts` or reference it in `vite.config.ts` `optimizeDeps.include`. The npm package is not a declared dependency and will fail in CI on a clean install
53. `UpdateTransaction.vue` uses `displayAmount` (formatted string) bound to the amount field, but the diff comparison uses `localTransaction.value.amount` (numeric). Sync `transaction.value.amount` into `localTransaction.value.amount` in `onSubmit` only when `displayAmount` differs from `originalDisplayAmount` — tracked via a ref set during the `watch` initialisation
54. CI runs against a dedicated **MoneyTrackerTest** Supabase project with email confirmation disabled — production Supabase is never touched by CI. Test credentials stored as `VITE_SUPABASE_URL_TEST` and `VITE_SUPABASE_ANON_KEY_TEST` GitHub Actions secrets, passed to the runner as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `playwright.yml`
55. Supabase free tier allows 2 active projects — one production, one test/CI
56. Supabase email rate limit on free tier is 1 email/hour and is read-only (cannot be changed). With email confirmation enabled, duplicate email registrations silently return success (intentional enumeration attack prevention) — the "shows error for duplicate email" test is not reliably testable
57. Register.vue checks `data.session` (not `data.user`) after `signUp` — `data.session` is null when email confirmation is required, non-null when auto-confirmed. Show "check your email" message and stay on register page when `data.session` is null; redirect to home when non-null
58. GitHub Actions secrets are required for CI to access Supabase — the `.env` file is in `.gitignore` and never reaches the CI runner. Local development uses `.env`; CI uses GitHub Secrets
