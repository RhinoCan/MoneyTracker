# MoneyTracker — Project Handoff Document

## Current Status

### Unit Tests
- **559 tests passing** across 31 files
- **99.29% statement coverage**, **95.63% branch coverage**
- All passes complete and stable

### E2E Tests (Playwright)
- **31 tests** across 4 spec files, 0 skipped
- **Status: 31/31 passing** — auth (8/8), locales (10/10), transactions (8/8), dataManagement (5/5)
- Browser: Chromium only for local dev (Firefox/WebKit commented out in config)
- Run with: `npx playwright test --project=chromium` or `npm run test:e2e`
- View results: `npx playwright show-report`
- Run a single test: `npx playwright test --project=chromium <file> --grep "<partial test name>"`

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
  helpers.ts           — shared login/logout/openSettings/addTransaction etc.
  auth.spec.ts         — login, logout, register flows
  transactions.spec.ts — add, update, delete transactions
  locales.spec.ts      — locale switching, RTL (Arabic), format hints
  dataManagement.spec.ts — export CSV, delete transactions, restore settings
```

### Key Design Decisions

- **workers: 1** — tests run serially, not in parallel (Supabase state shared across tests)
- **test.setTimeout(60000)** on locales.spec.ts — locale tests are slow due to multiple Supabase round-trips
- **`data-testid` attributes** are the standard approach for all interactive elements to avoid locale-dependent selectors
- **Dialog close pattern**: always wait for `getByRole('dialog').not.toBeVisible()` + `waitForTimeout(300)` after closing any Vuetify dialog to let the scrim animation fully clear
- **Vuetify v-select**: must be clicked via `page.locator('[data-testid="locale-select"]').click()` — clicking the inner input directly is unreliable
- **Locale-dependent UI**: after switching locale, ALL button labels and text change language. Always use `data-testid` for anything clicked after a locale change — never rely on text labels or role+name selectors

### data-testid Inventory

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

### Locale Dropdown Design
The locale v-select displays options in the format:
```
{code} - {English name} - {localized name}
```
e.g. `de-DE - German (Germany) - Deutsch (Deutschland)`

The localized name changes with the current UI language; the code and English
name are always present. `selectLocale` in `helpers.ts` filters on `"{code} -"`
scoped inside the listbox element:

```ts
const listbox = page.getByRole('listbox');
await listbox.locator('[role="option"]').filter({ hasText: `${localeCode} -` }).click();
```

All locale-related test calls use locale codes (`'de-DE'`, `'en-US'`) not display names.

### Export CSV Test Note
The Export CSV button is disabled when there are no transactions. The test adds
a transaction before opening the Data Management dialog to ensure the button is
always enabled regardless of what prior tests left behind.

---

## Dependencies

### Removed Packages
The following packages were installed during early development and subsequently removed as unused:

| Package | Reason removed |
|---------|---------------|
| `@fontsource/roboto` | Replaced by Google Fonts CDN link in `index.html` |
| `vue-toastification` | Replaced by the custom `NotificationStore` snackbar system |
| `date-fns` | Not used — Vuetify date picker uses `VuetifyDateAdapter` (built-in) |
| `@date-io/date-fns` | Not used — Vuetify date picker uses `VuetifyDateAdapter` (built-in) |

---

## Known App Bugs Fixed This Session

### Arabic locale `currencyParser` (ar-SA)
**Root cause:** JavaScript's `\d` regex character class only matches ASCII digits 0–9.
`ar-SA` formats numbers using Eastern Arabic-Indic digits (U+0660–U+0669), e.g.
`100` → `١٠٠`. The cleanup regex stripped these as non-digits, leaving an empty
string that `parseFloat` turned into `NaN`.

**Fix:** Added digit normalization as step 2 in `parseCurrency`, before any regex
processing:
```ts
rawString = rawString
  .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
```
Also handles Extended Arabic-Indic digits (U+06F0–U+06F9, used in Persian/Urdu).
The Arabic transaction test in `locales.spec.ts` is now unskipped and passing.

---

## Remaining Work

### Optional Enhancements
- **Accessibility audit**: add `@axe-core/playwright` and run it against key pages — a handful of lines per spec file, looks impressive, meaningful signal. Icon buttons already have `aria-label` attributes and RTL is supported for Arabic.
- **Playwright auth state caching**: currently each test authenticates fresh against Supabase, making the suite slow. Caching auth state would speed it up significantly.

---

## Key Tips for Future Sessions

### Unit Testing
1. Always `cat` files with line numbers before writing tests — don't trust line number guesses
2. For `Intl.NumberFormat` mocks — always use `vi.spyOn` + `spy.mockRestore()` at end of test to avoid poisoning subsequent tests
3. For store error branches — use `.mockResolvedValueOnce({ error: {...} })` on the supabase chain
4. For `deleteTransaction`/`deleteAllTransactions` — do NOT set up `eq` mocks in `beforeEach`; each test sets up its own locally
5. `vi.unmock("@/lib/Logger")` in `Logger.spec.ts` must remain the very first line
6. Request full file contents before regenerating any spec file
7. When a source file gains new properties on a type (e.g. `LocaleItem` gaining `englishName`), search for all spec files that assert against that type and update their `toEqual` expectations

### E2E Testing
8. Vuetify dialogs leave a `.v-overlay__scrim` that blocks clicks — always wait for dialog to be fully gone before next action
9. Always use `data-testid` for any element that might be clicked after a locale change — never rely on text labels
10. `row.locator('.v-chip', { hasText: /expense/i })` is the correct way to assert transaction type in a row — `getByRole('cell', { name: /expense/i })` causes a strict mode violation when the description also contains the word "expense"
11. The Playwright HTML report (`npx playwright show-report`) is far more useful than terminal output for debugging failures
12. To inspect Vuetify dropdown DOM without it closing: use `setTimeout(() => { console.log(...) }, 3000)` in the console then quickly open the dropdown
13. TrackerHeader.vue has TWO buttons each for Settings and Data Management (desktop + mobile responsive variants) — both need `data-testid`; always use `.first()` when clicking them
14. `openSettings` and `openDataManagement` both use `expect(page.getByRole('dialog')).toBeVisible()` — NOT text content, which breaks in non-English locales and causes strict mode violations
15. `selectLocale` scopes option lookup inside `page.getByRole('listbox')` — page-wide `getByRole('option')` matching is unreliable with Vuetify selects
16. `addTransaction` in helpers.ts uses `.first()` on the final cell assertion — duplicate rows from prior test runs would otherwise cause a strict mode violation
17. All DataManagement.vue action buttons have `data-testid` attributes — always use these in tests, never button text, since the dialog renders in whatever locale is currently active
18. `window.confirm()` in DataManagement.vue handlers must be handled with `page.on('dialog', d => d.accept())` registered **before** the button click, otherwise Playwright hangs
19. The nuclear option (`delete-everything-btn`) calls `window.location.reload()` — follow it with `page.waitForLoadState('networkidle')` before making further assertions
20. The Export CSV button is disabled when there are no transactions — always add a transaction before testing it
