// tests/e2e/transactions.spec.ts
import { test, expect } from '@playwright/test';
import { login, logout, addTransaction } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.afterEach(async ({ page }) => {
  await logout(page);
});

// -------------------------------------------------------------------------
// Add Transaction
// -------------------------------------------------------------------------
test.describe('Add Transaction', () => {
  test('adds an expense and shows it in Transaction History', async ({ page }) => {
    const description = `Expense ${Date.now()}`;
    await addTransaction(page, description, '42.50', 'Expense');

    // Scope to the row, then check the v-chip for the type.
    // Cannot use getByRole('cell', { name: /expense/i }) — the description itself
    // contains "Expense", causing a strict mode violation (two matching cells).
    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await expect(row).toBeVisible();
    await expect(row.locator('.v-chip', { hasText: /expense/i })).toBeVisible();
  });

  test('adds an income transaction and shows it in Transaction History', async ({ page }) => {
    const description = `Income ${Date.now()}`;
    await addTransaction(page, description, '1000.00', 'Income');

    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await expect(row).toBeVisible();
    await expect(row.locator('.v-chip', { hasText: /income/i })).toBeVisible();
  });

  test('RESET button clears the form', async ({ page }) => {
    await page.locator('[data-testid="description-field"] input').fill('Test reset');
    await page.locator('[data-testid="amount-field"] input').click();
    await page.locator('[data-testid="amount-field"] input').fill('99.99');
    await page.locator('[data-testid="reset-btn"]').click();

    await expect(page.locator('[data-testid="description-field"] input')).toHaveValue('');
  });
});

// -------------------------------------------------------------------------
// Update Transaction
// -------------------------------------------------------------------------
test.describe('Update Transaction', () => {
  test('updates the description of an existing transaction', async ({ page }) => {
    const original = `Original ${Date.now()}`;
    const updated = `Updated ${Date.now()}`;

    await addTransaction(page, original, '25.00', 'Expense');

    const row = page.getByRole('row', { name: new RegExp(original, 'i') });
    await row.locator('[data-testid="update-btn"]').click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const descField = page.getByRole('dialog').getByLabel(/description/i);
    await descField.clear();
    await descField.fill(updated);

    await page.locator('[data-testid="update-transaction-btn"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);

    await expect(page.getByRole('cell', { name: updated })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('cell', { name: original })).not.toBeVisible();
  });

  test('CANCEL closes the Update Transaction dialog without saving', async ({ page }) => {
    const description = `No Change ${Date.now()}`;
    await addTransaction(page, description, '10.00', 'Expense');

    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await row.locator('[data-testid="update-btn"]').click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="cancel-update-btn"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);

    await expect(page.getByRole('cell', { name: description })).toBeVisible();
  });
});

// -------------------------------------------------------------------------
// Delete Transaction
// -------------------------------------------------------------------------
test.describe('Delete Transaction', () => {
  test('shows the Confirm or Cancel Delete dialog when trash icon is clicked', async ({ page }) => {
    const description = `To Delete ${Date.now()}`;
    await addTransaction(page, description, '15.00', 'Expense');

    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await row.locator('[data-testid="delete-btn"]').click();

    await expect(page.getByText('Confirm or Cancel Delete')).toBeVisible();
    await expect(page.getByRole('dialog').getByText(description)).toBeVisible();

    await page.locator('[data-testid="confirm-delete-btn"]').waitFor({ state: 'visible' });
    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
  });

  test('deletes a transaction after confirming', async ({ page }) => {
    const description = `Delete Me ${Date.now()}`;
    await addTransaction(page, description, '15.00', 'Expense');

    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await row.locator('[data-testid="delete-btn"]').click();

    await expect(page.getByText('Confirm or Cancel Delete')).toBeVisible();
    await page.locator('[data-testid="confirm-delete-btn"]').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);

    await expect(page.getByRole('cell', { name: description })).not.toBeVisible({ timeout: 8000 });
  });

  test('CANCEL on delete dialog preserves the transaction', async ({ page }) => {
    const description = `Keep Me ${Date.now()}`;
    await addTransaction(page, description, '20.00', 'Expense');

    const row = page.getByRole('row', { name: new RegExp(description, 'i') });
    await row.locator('[data-testid="delete-btn"]').click();

    await expect(page.getByText('Confirm or Cancel Delete')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);

    await expect(page.getByRole('cell', { name: description })).toBeVisible();
  });
});
