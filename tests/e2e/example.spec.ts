import { test, expect } from '@playwright/test';

test('Login and Locale Change', async ({ page }) => {
  await page.goto('http://localhost:5173/MoneyTracker/login');

  // Login
  await page.getByLabel(/Email Address/i).fill('foo@foobar.com');
  await page.getByLabel(/Password/i).fill('foobar');
  await page.getByRole('button', { name: /Sign In/i }).click();

  // 1. WAIT for the Login card to disappear.
  // This ensures the "White Screen" transition is finished.
  await expect(page.getByText(/Login to your account/i)).not.toBeVisible();

  // 2. Open Settings (Using the ID from your HeaderTracker)
  await page.locator('#showSettings').click();

  // 3. Change language
  // We click the current language to open the dropdown
  await page.getByText(/American English/i).first().click();
  await page.getByText(/Canadian French/i).click();

  // 4. Save and Wait for Dialog to Close
  await page.getByRole('button', { name: /Save Changes/i }).click();

  // 5. THE FINAL CHECK: Look for the French text
  // Since you saw 'Parametres' on screen, let's verify that!
  await expect(page.locator('#showSettings')).toContainText(/Paramètres/i);
});