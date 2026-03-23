// tests/e2e/helpers.ts
import { type Page, expect } from '@playwright/test';

// -------------------------------------------------------------------------
// Credentials
// -------------------------------------------------------------------------
export const TEST_USER = {
  email: 'rhinocan@outlook.com',
  password: 'rschl0chA',
};

// -------------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------------
export const ROUTES = {
  home:     '/MoneyTracker/',
  login:    '/MoneyTracker/login',
  register: '/MoneyTracker/register',
  forgotPassword: '/MoneyTracker/forgot-password',
  resetPassword: '/MoneyTracker/reset-password',
};

// -------------------------------------------------------------------------
// login
// -------------------------------------------------------------------------
export async function login(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
) {
  await page.waitForTimeout(500); // Avoid Supabase rate limiting
  await page.goto(ROUTES.login);
  await page.getByLabel(/email address/i).fill(email);
  await page.locator('[data-testid="password-field"] input').fill(password);
  await page.getByRole('button', { name: 'SIGN IN' }).click();

  await expect(page.getByText(email, { exact: false })).toBeVisible({ timeout: 10000 });
}

// -------------------------------------------------------------------------
// logout
// -------------------------------------------------------------------------
export async function logout(page: Page) {
  await page.locator('[data-testid="logoff"]').click({ timeout: 10000 });
  await expect(page).toHaveURL(/login/, { timeout: 15000 });
}

// -------------------------------------------------------------------------
// register
// -------------------------------------------------------------------------
export async function register(page: Page, email: string, password: string) {
  await page.goto(ROUTES.register);
  await page.getByLabel(/email address/i).fill(email);
  await page.locator('[data-testid="password-field"] input').fill(password);
  await page.locator('[data-testid="confirm-password-field"] input').fill(password);
  await page.getByRole('button', { name: 'SIGN UP' }).click();
  // With email confirmation enabled, the app stays on the register page
  // and shows a success message
  await expect(page).toHaveURL(/MoneyTracker\/register/, { timeout: 10000 });
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
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
}

export async function closeDataManagement(page: Page) {
  await page.getByRole('dialog').locator('.v-btn--icon').first().click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(300);
}

// -------------------------------------------------------------------------
// selectLocale
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

  await expect(page.getByRole('cell', { name: description }).first()).toBeVisible({ timeout: 8000 });
}

// -------------------------------------------------------------------------
// generateTestEmail
// -------------------------------------------------------------------------
export function generateTestEmail(): string {
  return `rhinocan+test${Date.now()}@outlook.com`;
}