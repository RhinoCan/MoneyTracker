MoneyTracker Test Suite — Handoff Document
Status

559 tests passing across 31 files
99.28% statement coverage
95.62% branch coverage
All first and second pass tests complete and stable


Completed This Session (Second Pass)
Composables & Utils

✅ useNumberFormatHints.spec.ts — ?? "." fallback (line 13), ?? "," fallback (line 21)
✅ useTransactionFormFields.spec.ts — formattedAmount focused branch (line 39), closeDatePicker / nextTick branch (lines 117–121), ?? 0 fallback in handleFocus (line 70)
✅ currencyParser.spec.ts — catch block (lines 53–60), ?? "." decimal separator fallback (line 19)
✅ localeList.spec.ts — display.of() throws for individual locale (lines 101–102), || code fallback when display.of() returns falsy (line 98)

Stores & Other

✅ SettingsStore.spec.ts — null-field fallbacks in loadSettings hydration (lines 92–94), saveToDb error branch (line 125), clearFromDb error branch (line 145)
✅ useCurrencyFormatter.spec.ts — || "en-US" and || "USD" fallbacks (lines 18–19)


Deliberately Skipped (with reasons)
FileLinesReasonposthog.ts1–19Pure init call, no testable logicSystemDefaults.ts6–38Module-level constants, not instrumentable by V8SystemDefaults.ts57–58Intl.DisplayNames.of() never returns undefined in jsdomrouter/index.ts72V8 instrumentation quirk with router singletonuseAppValidationRules.ts80V8 branch instrumentation quirk, statement is coveredSettingsStore.ts57–68seedToDb private guard (if (!userStore.userId) return) unreachable from public APIComponent function %—Vuetify SFC instrumentation artifact; statement/line coverage is 100%Page function %—Misleading; statement/line coverage is 100%

Tips for Next Session

Always cat files with line numbers before writing tests — don't trust line number guesses from context.
Save files as .txt to avoid VSCode syntax errors when catting source files.
Request full file contents before regenerating any spec file — the assistant won't have the current spec files in context at the start of a new chat.
The vi.unmock("@/lib/Logger") line in Logger.spec.ts must remain the very first line — setup.ts globally mocks Logger for all other test files, and this unmock overrides it only for that file.
When mocking Intl.NumberFormat or Intl.NumberFormat.prototype.formatToParts, always use vi.spyOn with mockImplementationOnce and call spy.mockRestore() immediately after the assertion — a bare mockImplementationOnce without restore will poison subsequent tests in the file.
For store error branches — the existing supabase mock chain pattern uses .mockReturnValue({ data: ..., error: ... }). To test error branches, override with .mockResolvedValueOnce({ error: { ... } }) for that specific test.
For deleteTransaction and deleteAllTransactions — do NOT set up eq mocks in beforeEach. Each test must set up its own eq mock locally to avoid consumption ordering issues between tests.
display.of() returning falsy (line 98 in localeList.ts) and display.of() throwing (lines 101–102) are two distinct branches requiring two distinct tests. Use a regular function (not an arrow function) when overriding Intl.DisplayNames.prototype.of so that this is correctly bound when delegating to the original.