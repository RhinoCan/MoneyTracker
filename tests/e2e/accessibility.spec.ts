// tests/e2e/accessibility.spec.ts
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  login,
  logout,
  openSettings,
  cancelSettings,
  openDataManagement,
  closeDataManagement,
  addTransaction,
  ROUTES,
} from "./helpers";

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------
async function runAxe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules([
      "aria-allowed-attr", // Vuetify 3 date picker uses aria-expanded on a non-combobox (internal, unfixable)
      "aria-tooltip-name", // Vuetify 3 tooltip overlay renders without accessible name (internal, unfixable)
      "aria-progressbar-name", // Vuetify 3 v-data-table loading spinner not labelable (internal, unfixable)
    ])
    .analyze();

  // Log moderate/minor violations as warnings without failing
  const minor = results.violations.filter((v) => v.impact === "moderate" || v.impact === "minor");
  if (minor.length > 0) {
    console.warn(
      "Minor/moderate axe violations:",
      JSON.stringify(
        minor.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
        })),
        null,
        2
      )
    );
  }

  // Fail on critical/serious only
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  expect(
    serious,
    `Axe critical/serious violations: ${JSON.stringify(
      serious.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.map((n) => n.html),
      })),
      null,
      2
    )}`
  ).toHaveLength(0);
}

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------
test.describe("Accessibility", () => {
  test.setTimeout(60000);

  let requiresLogout = false;

  // --- Logged-out pages ---

  test("login page", async ({ page }) => {
    requiresLogout = false;
    await page.goto(ROUTES.login);
    await runAxe(page);
  });

  test("register page", async ({ page }) => {
    requiresLogout = false;
    await page.goto(ROUTES.register);
    await runAxe(page);
  });

  // --- Logged-in pages ---

  test("home page", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    await runAxe(page);
  });

  test("settings dialog", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    await openSettings(page);
    try {
      await runAxe(page);
    } finally {
      await cancelSettings(page);
    }
  });

  test("settings dialog — InfoIcon visible (timeout mode)", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    await openSettings(page);
    const persistSwitch = page.locator('.v-switch input[type="checkbox"]');
    const isChecked = await persistSwitch.isChecked();
    if (isChecked) {
      await persistSwitch.click();
    }
    await page.waitForTimeout(500); // allow login snackbar to clear before scanning
    try {
      await runAxe(page);
    } finally {
      await cancelSettings(page);
    }
  });

  test("data management dialog", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    await openDataManagement(page);
    try {
      await runAxe(page);
    } finally {
      await closeDataManagement(page);
    }
  });

  test("keyboard shortcuts dialog — from AddTransaction", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    await page.locator('[data-testid="add-transaction-btn"]').waitFor({ state: "visible" });
    await page.locator('button[aria-label="Help"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Wait for tooltip animation to complete before scanning
    await page.waitForTimeout(500);
    try {
      await runAxe(page);
    } finally {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test("keyboard shortcuts dialog — from UpdateTransaction", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    // Ensure at least one transaction exists
    const rows = page.locator('[data-testid="update-btn"]');
    const count = await rows.count();
    if (count === 0) {
      await addTransaction(page, "Accessibility test transaction", "42.00", "Expense");
    }
    // Open update dialog
    await page.locator('[data-testid="update-btn"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    // Open keyboard shortcuts from within update dialog — scope to the update dialog
    await page.locator('[role="dialog"]').first().locator('button[aria-label="Help"]').click();
    await expect(page.getByRole("dialog").nth(1)).toBeVisible({ timeout: 5000 });
    try {
      await runAxe(page);
    } finally {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test("delete transaction dialog", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    const rows = page.locator('[data-testid="delete-btn"]');
    const count = await rows.count();
    if (count === 0) {
      await addTransaction(page, "Accessibility test transaction", "42.00", "Expense");
    }
    await page.locator('[data-testid="delete-btn"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500); // allow snackbar transition to complete before scanning
    try {
      await runAxe(page);
    } finally {
      await page
        .getByRole("dialog")
        .locator("button")
        .filter({ hasText: /cancel/i })
        .click();
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);
    }
  });

  test("update transaction dialog", async ({ page }) => {
    requiresLogout = true;
    await login(page);
    const rows = page.locator('[data-testid="update-btn"]');
    const count = await rows.count();
    if (count === 0) {
      await addTransaction(page, "Accessibility test transaction", "42.00", "Expense");
    }
    await page.locator('[data-testid="update-btn"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    try {
      await runAxe(page);
    } finally {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test.afterEach(async ({ page }) => {
    if (!requiresLogout) return;
    try {
      await logout(page);
    } catch {
      // ignore
    }
  });
});
