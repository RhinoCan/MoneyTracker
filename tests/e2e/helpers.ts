// tests/e2e/helpers.ts
import { type Page, expect } from '@playwright/test';

// -------------------------------------------------------------------------
// Credentials
// -------------------------------------------------------------------------
export const TEST_USER = {
  email: 'foo@foobar.com',
  password: 'foobar',
};

// -------------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------------
export const ROUTES = {
  home:     '/MoneyTracker/',
  login:    '/MoneyTracker/login',
  register: '/MoneyTracker/register',
};

// -------------------------------------------------------------------------
// login
// -------------------------------------------------------------------------
export async function login(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
) {
  await page.goto(ROUTES.login);
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: 'SIGN IN' }).click();

  await expect(page.getByText(email, { exact: false })).toBeVisible({ timeout: 10000 });
}

// -------------------------------------------------------------------------
// logout
// -------------------------------------------------------------------------
export async function logout(page: Page) {
  await page.locator('[data-testid="logoff"]').click({ timeout: 10000 });
  await expect(page).toHaveURL(/login/, { timeout: 10000 });
}

// -------------------------------------------------------------------------
// openSettings / saveSettings / cancelSettings
// -------------------------------------------------------------------------
export async function openSettings(page: Page) {
  await page.locator('[data-testid="open-settings"]').first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

export async function saveSettings(page: Page) {
  await page.locator('[data-testid="settings-save"]').click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);
}

export async function cancelSettings(page: Page) {
  await page.locator('[data-testid="settings-cancel"]').click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);
}

// -------------------------------------------------------------------------
// openDataManagement / closeDataManagement
// -------------------------------------------------------------------------
export async function openDataManagement(page: Page) {
  await page.locator('[data-testid="open-data-management"]').first().click();
  // Wait for the dialog role, not getByText — "Data Management" also appears
  // in the header nav button, causing a strict mode violation.
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

export async function closeDataManagement(page: Page) {
  // Closes via the X button in the dialog title bar
  await page.getByRole('dialog').locator('.v-btn--icon').first().click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);
}

// -------------------------------------------------------------------------
// selectLocale
// Opens the locale dropdown and selects the option whose text starts with
// the given locale code (e.g. 'en-US', 'de-DE').
//
// Option text format: "{code} - {English name} - {localized name}"
// Scoped inside the listbox element to avoid page-wide matching issues.
// -------------------------------------------------------------------------
export async function selectLocale(page: Page, localeCode: string) {
  await page.locator('[data-testid="locale-select"]').click();
  await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5000 });

  const listbox = page.getByRole('listbox');
  await listbox.locator('[role="option"]').filter({ hasText: `${localeCode} -` }).click();

  await expect(page.getByRole('listbox')).not.toBeVisible({ timeout: 5000 });
}

// -------------------------------------------------------------------------
// addTransaction
// -------------------------------------------------------------------------
export async function addTransaction(
  page: Page,
  description: string,
  amount: string,
  type: 'Income' | 'Expense' = 'Expense'
) {
  await page.locator('[data-testid="description-field"] input').fill(description);
  await page.locator(`[data-testid="${type === 'Income' ? 'income-radio' : 'expense-radio'}"]`).click();
  await page.locator('[data-testid="amount-field"] input').click();
  await page.locator('[data-testid="amount-field"] input').fill(amount);
  await page.locator('[data-testid="amount-field"] input').blur();
  await page.locator('[data-testid="add-transaction-btn"]').click();

  // .first() avoids strict mode violation if duplicate rows exist from prior runs
  await expect(page.getByRole('cell', { name: description }).first()).toBeVisible({ timeout: 8000 });
}

// -------------------------------------------------------------------------
// generateTestEmail
// -------------------------------------------------------------------------
export function generateTestEmail(): string {
  return `foo+test${Date.now()}@foobar.com`;
}
