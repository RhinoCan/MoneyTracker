// tests/e2e/accessibility.spec.ts
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
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
async function runAxe(page: Page, excludeSelectors: string[] = []) {
  let builder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .disableRules([
      "aria-allowed-attr",
      "aria-tooltip-name",
      "aria-progressbar-name",
    ]);

  for (const selector of excludeSelectors) {
    builder = builder.exclude(selector);
  }

  const results = await builder.analyze();

  const minor = results.violations.filter(
    (v) => v.impact === "moderate" || v.impact === "minor"
  );
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

  // --- Logged-out pages ---

  test("login page", async ({ page }) => {
    await page.goto(ROUTES.login);
    await runAxe(page);
  });

  test("register page", async ({ page }) => {
    await page.goto(ROUTES.register);
    await runAxe(page);
  });

  // --- Logged-in pages ---

  test("home page", async ({ page }) => {
    await page.goto(ROUTES.home);
    await runAxe(page);
  });

  test("settings dialog", async ({ page }) => {
    await page.goto(ROUTES.home);
    await openSettings(page);
    try {
      await runAxe(page, ["main"]);
    } finally {
      await cancelSettings(page);
    }
  });

  test("settings dialog — InfoIcon visible (timeout mode)", async ({ page }) => {
    await page.goto(ROUTES.home);
    await openSettings(page);
    const persistSwitch = page.locator('.v-switch input[type="checkbox"]');
    const isChecked = await persistSwitch.isChecked();
    if (isChecked) {
      await persistSwitch.click();
    }
    await page.waitForTimeout(300);
    try {
      await runAxe(page, ["main"]);
    } finally {
      await cancelSettings(page);
    }
  });

  test("data management dialog", async ({ page }) => {
    await page.goto(ROUTES.home);
    await openDataManagement(page);
    try {
      await runAxe(page, ["main"]);
    } finally {
      await closeDataManagement(page);
    }
  });

  test("keyboard shortcuts dialog — from AddTransaction", async ({ page }) => {
    await page.goto(ROUTES.home);
    await page.locator('[data-testid="add-transaction-btn"]').waitFor({ state: "visible" });
    await page.locator('button[aria-label="Help"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    try {
      await runAxe(page, ["main"]);
    } finally {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test("keyboard shortcuts dialog — from UpdateTransaction", async ({ page }) => {
    await page.goto(ROUTES.home);
    const rows = page.locator('[data-testid="update-btn"]');
    const count = await rows.count();
    if (count === 0) {
      await addTransaction(page, "Accessibility test transaction", "42.00", "Expense");
    }
    await page.locator('[data-testid="update-btn"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.locator('[role="dialog"]').first().locator('button[aria-label="Help"]').click();
    await expect(page.getByRole("dialog").nth(1)).toBeVisible({ timeout: 5000 });
    try {
      await runAxe(page, ["main"]);
    } finally {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test("delete transaction dialog", async ({ page }) => {
    await page.goto(ROUTES.home);
    const rows = page.locator('[data-testid="delete-btn"]');
    const count = await rows.count();
    if (count === 0) {
      await addTransaction(page, "Accessibility test transaction", "42.00", "Expense");
    }
    await page.locator('[data-testid="delete-btn"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);
    try {
      await runAxe(page, ["main"]);
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
    await page.goto(ROUTES.home);
    const rows = page.locator('[data-testid="update-btn"]');
    const count = await rows.count();
    if (count === 0) {
      await addTransaction(page, "Accessibility test transaction", "42.00", "Expense");
    }
    await page.locator('[data-testid="update-btn"]').first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    try {
      await runAxe(page, ["main"]);
    } finally {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });
});