// tests/e2e/locales.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { login, logout, openSettings, saveSettings, cancelSettings, selectLocale, addTransaction } from './helpers';

test.setTimeout(60000);

// -------------------------------------------------------------------------
// Helper — change locale via Settings dialog
// -------------------------------------------------------------------------
async function changeLocale(page: Page, localeCode: string) {
  await openSettings(page);
  await selectLocale(page, localeCode);
  await saveSettings(page);
}

// -------------------------------------------------------------------------
// Helper — reset locale back to American English
// -------------------------------------------------------------------------
async function resetToEnglish(page: Page) {
  await openSettings(page);
  await selectLocale(page, 'en-US');
  await saveSettings(page);
}

// -------------------------------------------------------------------------
// Setup / teardown
// -------------------------------------------------------------------------
test.beforeEach(async ({ page }) => {
  await login(page);
});

test.afterEach(async ({ page }) => {
  await resetToEnglish(page);
  await logout(page);
});

// -------------------------------------------------------------------------
// Locale switching — Settings dialog
// -------------------------------------------------------------------------
test.describe('Locale switching', () => {
  test('switches to German (de-DE) — comma decimal in amount hint', async ({ page }) => {
    await changeLocale(page, 'de-DE');

    const hint = page.locator('[data-testid="amount-field"] .v-messages__message');
    await expect(hint).toBeVisible({ timeout: 8000 });
    await expect(hint).toContainText(',');
  });

  test('switches to French (fr-FR)', async ({ page }) => {
    await changeLocale(page, 'fr-FR');
    await expect(page.locator('[data-testid="open-settings"]').first()).toBeVisible();
    await openSettings(page);
    await cancelSettings(page);
  });

  test('switches to Japanese (ja-JP) — hint is visible in Japanese', async ({ page }) => {
    await changeLocale(page, 'ja-JP');

    const hint = page.locator('[data-testid="amount-field"] .v-messages__message');
    await expect(hint).toBeVisible({ timeout: 8000 });
    await expect(hint).toContainText('形式');
  });

  test('switches to Canadian French (fr-CA)', async ({ page }) => {
    await changeLocale(page, 'fr-CA');
    await expect(page.locator('[data-testid="open-settings"]').first()).toBeVisible();
    await openSettings(page);
    await cancelSettings(page);
  });

  test('switches to Brazilian Portuguese (pt-BR)', async ({ page }) => {
    await changeLocale(page, 'pt-BR');
    await expect(page.locator('[data-testid="open-settings"]').first()).toBeVisible();
    await openSettings(page);
    await cancelSettings(page);
  });

  test('switches to Korean (ko-KR)', async ({ page }) => {
    await changeLocale(page, 'ko-KR');
    await expect(page.locator('[data-testid="open-settings"]').first()).toBeVisible();
    await openSettings(page);
    await cancelSettings(page);
  });
});

// -------------------------------------------------------------------------
// Transactions work correctly in non-English locales
// -------------------------------------------------------------------------
test.describe('Transactions in non-English locales', () => {
  test('can add and delete a transaction in German locale', async ({ page }) => {
    await changeLocale(page, 'de-DE');

    const description = `DE Test ${Date.now()}`;
    await addTransaction(page, description, '42,50', 'Expense');
    await expect(page.getByRole('cell', { name: description })).toBeVisible();

    // Clean up
    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await row.locator('[data-testid="delete-btn"]').click();
    await page.locator('[data-testid="confirm-delete-btn"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await expect(page.getByRole('cell', { name: description })).not.toBeVisible({ timeout: 8000 });
  });
});

// -------------------------------------------------------------------------
// RTL layout — Arabic (Saudi Arabia)
// -------------------------------------------------------------------------
test.describe('RTL layout — Arabic (ar-SA)', () => {
  test('switches to Arabic and html lang attribute is set to ar-SA', async ({ page }) => {
    await changeLocale(page, 'ar-SA');

    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toMatch(/ar/);
  });

  test('page renders in RTL direction when Arabic is selected', async ({ page }) => {
    await changeLocale(page, 'ar-SA');

    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

// Skipped: app bug — amount field rejects numeric input in ar-SA locale
// See: currencyParser does not handle Arabic locale input
test('can add and delete a transaction in Arabic locale', async ({ page }) => {
    await changeLocale(page, 'ar-SA');

    const description = `AR Test ${Date.now()}`;
    await addTransaction(page, description, '100', 'Expense');
    await expect(page.getByRole('cell', { name: description })).toBeVisible();

    // Clean up
    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await row.locator('[data-testid="delete-btn"]').click();
    await page.locator('[data-testid="confirm-delete-btn"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    await expect(page.getByRole('cell', { name: description })).not.toBeVisible({ timeout: 8000 });
  });
});