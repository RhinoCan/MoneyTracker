Here's the updated handoff document:

---

# MoneyTracker Test Suite — Third Pass Coverage Checklist

## Status
- **527+ tests passing** across 31 files
- **97.17%+ statement coverage**
- All first and second pass tests complete and stable

## Completed This Session
- ✅ `Settings.spec.ts` — `isMessagePersistent` setter false branch (line 55)
- ✅ `AddTransaction.spec.ts` — `amountHint` focused with correct separator (line 56)
- ✅ `DataManagement.spec.ts` — catch blocks in `handleDeleteAllTransactions` (29–30), `handleDeleteAllSettings` (54–59), `handleDeleteAllData` (85–90)
- ✅ `DeleteTransaction.spec.ts` — missing item path (31–38), `logInfo` on success (45–49), catch block (52–58)
- ✅ `SettingsStore.spec.ts` — `seedToDb` payload and error (59–68), `loadSettings` null-field fallbacks (92–94), `saveToDb` error (125), `clearFromDb` error (145)
- ✅ `TransactionStore.spec.ts` — `handleSupabaseError` unknown code fallback (82), error branches in all 5 actions (136, 161, 187, 207)
- ✅ `UserStore.spec.ts` — `onAuthStateChange` callback: SIGNED_IN new user (85–92), SIGNED_IN same user (85 false branch), SIGNED_OUT (94–104), state clear (81–82)
- ✅ `useCurrencyFormatter.spec.ts` — catch block when `Intl.NumberFormat` throws (26–34)

## Still To Do

### Composables & Utils
- `useNumberFormatHints.spec.ts` — `?? "."` fallback (line 13), `?? ","` fallback (line 21)
- `useTransactionFormFields.spec.ts` — `closeDatePicker` / `nextTick` branch (lines 39–40)
- `currencyParser.spec.ts` — catch block (lines 53–60)
- `localeList.spec.ts` — catch when `display.of()` throws (lines 101–102)

## Deliberately Skipped (with reasons)
- `posthog.ts` — pure init call, no testable logic
- `SystemDefaults.ts` lines 6–38 — module-level constants, not instrumentable by V8
- `SystemDefaults.ts` lines 57–58 — `Intl.DisplayNames.of()` never returns `undefined` in jsdom
- `router/index.ts` line 72 — V8 instrumentation quirk with router singleton, test exists but line won't show covered
- `useAppValidationRules.ts` line 80 — V8 branch instrumentation quirk, statement is covered
- Pages 50% functions — misleading; statement/line coverage is 100%
- Component low function % — Vuetify SFC instrumentation artifact

## Tips for Next Session

1. **Always `cat` files with line numbers** before writing tests — don't trust line number guesses from context.

2. **Save files as `.txt`** to avoid VSCode syntax errors when catting source files.

3. **For `useNumberFormatHints.spec.ts`** — the two fallbacks are `?? "."` and `?? ","` on lines 13 and 21. These are hit when `Intl.NumberFormat` produces a format string that doesn't contain the expected separator character. Force this by mocking `Intl.NumberFormat` to return a format string without the separator.

4. **For `useTransactionFormFields.spec.ts`** — `closeDatePicker` calls `nextTick` then sets `dateMenu.value = false`. Test by setting `dateMenu` to true, calling `closeDatePicker`, awaiting `nextTick`, and asserting `dateMenu` is false.

5. **For store error branches** — the existing supabase mock chain pattern uses `.mockReturnValue({ data: ..., error: ... })`. To test error branches, override with `.mockReturnValueOnce({ error: { code: "23505", message: "...", details: "", hint: "" } })` for that specific test.

6. **For `deleteTransaction` and `deleteAllTransactions`** — do NOT set up `eq` mocks in `beforeEach`. Each test must set up its own `eq` mock locally to avoid consumption ordering issues between tests.

7. **Request full file contents** before regenerating any spec file — the assistant won't have the current spec files in context at the start of a new chat.

8. **The `vi.unmock("@/lib/Logger")` line in `Logger.spec.ts` must remain the very first line** — `setup.ts` globally mocks Logger for all other test files, and this unmock overrides it only for that file.