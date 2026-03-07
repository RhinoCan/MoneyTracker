# MoneyTracker — Command Reference

## ESLint

Run ESLint across the entire project in one pass:
```bash
npx eslint . --ext .ts,.vue
```

Run with auto-fix for fixable issues:
```bash
npx eslint . --ext .ts,.vue --fix
```

---

## cat — View File Contents

View a single file with line numbers:
```bash
cat -n src/components/AddTransaction.vue
```

View all `.vue` files in a folder (one after another):
```bash
cat -n src/components/*.vue
```

View all files of a given type recursively across the project:
```bash
find src -name "*.vue" -exec cat -n {} \;
```

---

## Vitest — Unit Tests

Run a single spec file:
```bash
npx vitest run tests/components/AddTransaction.spec.ts
```

Run all spec files in a folder:
```bash
npx vitest run tests/components/
```

Run all spec files in the project:
```bash
npx vitest run
```

Run all spec files with coverage:
```bash
npx vitest run --coverage
```

Run a single spec file with coverage:
```bash
npx vitest run --coverage tests/components/AddTransaction.spec.ts
```

Run all spec files in a folder with coverage:
```bash
npx vitest run --coverage tests/components/
```

Run in watch mode (re-runs on file change — useful during development):
```bash
npx vitest
```

Run a single test by name (partial match):
```bash
npx vitest run --grep "renders the date field"
```

---

## Playwright — E2E Tests

Run all spec files (Chromium only, as configured):
```bash
npx playwright test --project=chromium
```

Or via the npm script:
```bash
npm run test:e2e
```

Run a single spec file:
```bash
npx playwright test --project=chromium tests/e2e/auth.spec.ts
```

Run a single test by name (partial match):
```bash
npx playwright test --project=chromium --grep "shows the home screen after successful login"
```

Run all accessibility tests:
```bash
npx playwright test --project=chromium tests/e2e/accessibility.spec.ts
```

View the HTML report after a run:
```bash
npx playwright show-report
```

Run in headed mode (shows the browser window — useful for debugging):
```bash
npx playwright test --project=chromium --headed
```

Run in debug mode (pauses at each step):
```bash
npx playwright test --project=chromium --debug tests/e2e/auth.spec.ts
```

---

## find — List Project Files

List all files in the project (excluding node_modules):
```bash
find . -not -path "*/node_modules/*" -type f
```

List all `.vue` files:
```bash
find src -name "*.vue" -type f
```

List all `.ts` files under `src`:
```bash
find src -name "*.ts" -type f
```

List all spec files:
```bash
find tests -name "*.spec.ts" -type f
```

List all locale JSON files:
```bash
find src/i18n/locales -name "*.json" -type f
```

List all files modified in the last 24 hours (useful after a session):
```bash
find . -not -path "*/node_modules/*" -type f -mtime -1
```

---

## Further Reading

### Bash Scripting
- **The Linux Command Line** (William Shotts) — free online at https://linuxcommand.org/tlcl.php — the definitive beginner-to-intermediate guide
- **Bash Reference Manual** — https://www.gnu.org/software/bash/manual/bash.html — complete official reference
- **Shell Scripting Tutorial** — https://www.shellscript.sh — concise practical examples

### Node.js Scripts (like add-locale-keys.mjs)
- **Node.js official docs** — https://nodejs.org/en/docs — covers the built-in `fs`, `path`, and `url` modules used in the locale script
- **Node.js `fs` module** — https://nodejs.org/api/fs.html — file system operations (`readFileSync`, `writeFileSync`, `readdirSync`)
- **ES Modules in Node** — https://nodejs.org/api/esm.html — explains `import`/`export` and the `.mjs` extension used in `add-locale-keys.mjs`
- **`__dirname` equivalent in ESM** — use `dirname(fileURLToPath(import.meta.url))` as shown in the locale script, since `__dirname` is not available in ES modules
