// tests/e2e/dataManagement.spec.ts
import { test, expect } from "@playwright/test";
import {
  openDataManagement,
  closeDataManagement,
  openSettings,
  saveSettings,
  cancelSettings,
  selectLocale,
  addTransaction,
  ROUTES,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.home);
});

// -------------------------------------------------------------------------
// Dialog opens and closes
// -------------------------------------------------------------------------
test("opens and closes the Data Management dialog via X button", async ({ page }) => {
  await openDataManagement(page);
  await closeDataManagement(page);
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

// -------------------------------------------------------------------------
// Export CSV
// -------------------------------------------------------------------------
test("Export CSV button triggers a file download", async ({ page }) => {
  // Export button is disabled when there are no transactions — add one first
  await addTransaction(page, "CSV Export Test", "10.00", "Expense");

  await openDataManagement(page);

  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-testid="export-csv-btn"]').click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  await closeDataManagement(page);
});

// -------------------------------------------------------------------------
// Delete All Transactions
// -------------------------------------------------------------------------
test("Delete All Transactions removes all transactions", async ({ page }) => {
  await addTransaction(page, "DM Test Transaction", "99.00", "Expense");
  await expect(page.getByRole("cell", { name: "DM Test Transaction" }).first()).toBeVisible();

  await openDataManagement(page);

  page.on("dialog", (dialog) => dialog.accept());
  await page.locator('[data-testid="delete-all-transactions-btn"]').click();

  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);

  await expect(page.getByRole("cell", { name: "DM Test Transaction" })).not.toBeVisible();
});

// -------------------------------------------------------------------------
// Restore All Settings to Defaults
// -------------------------------------------------------------------------
test("Restore All Settings to Defaults resets locale to American English", async ({ page }) => {
  // Change locale to something non-default
  await openSettings(page);
  await selectLocale(page, "de-DE");
  await saveSettings(page);

  // Use data-testid — locale-independent, works regardless of current UI language
  await openDataManagement(page);

  page.on("dialog", (dialog) => dialog.accept());
  await page.locator('[data-testid="restore-settings-btn"]').click();

  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);

  // Locale should be back to en-US
  await openSettings(page);
  await expect(page.locator('[data-testid="locale-select"]')).toContainText("en-US", {
    timeout: 5000,
  });
  await cancelSettings(page);
});

// -------------------------------------------------------------------------
// Delete All Transactions AND Settings
// -------------------------------------------------------------------------
test("Delete All Transactions and Settings clears transactions and resets settings", async ({
  page,
}) => {
  await addTransaction(page, "All Gone Test", "55.00", "Expense");
  await expect(page.getByRole("cell", { name: "All Gone Test" }).first()).toBeVisible();

  // Change locale to something non-default
  await openSettings(page);
  await selectLocale(page, "fr-FR");
  await saveSettings(page);

  // Use data-testid — locale-independent
  await openDataManagement(page);

  page.on("dialog", (dialog) => dialog.accept());
  await page.locator('[data-testid="delete-everything-btn"]').click();

  // This action calls window.location.reload() — wait for the page to settle
  await page.waitForLoadState("networkidle", { timeout: 15000 });
  await page.waitForTimeout(300);

  // Transaction should be gone
  await expect(page.getByRole("cell", { name: "All Gone Test" })).not.toBeVisible();

  // Locale should be reset to en-US
  await openSettings(page);
  await expect(page.locator('[data-testid="locale-select"]')).toContainText("en-US", {
    timeout: 5000,
  });
  await cancelSettings(page);
});
