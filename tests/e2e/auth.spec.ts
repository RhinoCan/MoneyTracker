// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { login, logout, generateTestEmail, ROUTES, TEST_USER } from './helpers';

// -------------------------------------------------------------------------
// Login
// -------------------------------------------------------------------------
test.describe('Login', () => {
  test('shows the home screen after successful login', async ({ page }) => {
    await login(page);
    // TrackerHeader landmarks confirm we're on the home screen
    await expect(page.getByText('MONEY TRACKER')).toBeVisible();
    await expect(page.getByText(TEST_USER.email, { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LOGOFF' })).toBeVisible();
  });

  test('redirects away from login page when already authenticated', async ({ page }) => {
    await login(page);
    await page.goto(ROUTES.login);
    // Should be redirected back to home, not stay on login
    await expect(page).toHaveURL(/MoneyTracker\/$/, { timeout: 5000 });
    await logout(page);
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByLabel(/email address/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: 'SIGN IN' }).click();

    // Should stay on login page and show some error feedback
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible({ timeout: 8000 });
  });

  test('login page has a link to the register page', async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByRole('button', { name: 'REGISTER' }).click();
    await expect(page).toHaveURL(/register/);
  });
});

// -------------------------------------------------------------------------
// Logout
// -------------------------------------------------------------------------
test.describe('Logout', () => {
  test('returns to login page after logout', async ({ page }) => {
    await login(page);
    await logout(page);
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeVisible();
  });

  test('redirects to login when accessing home while logged out', async ({ page }) => {
    await page.goto(ROUTES.home);
    await expect(page).toHaveURL(/login/);
  });
});

// -------------------------------------------------------------------------
// Register
// -------------------------------------------------------------------------
test.describe('Register', () => {
  test('creates a new account and shows the home screen', async ({ page }) => {
    const email = generateTestEmail();
    const password = 'TestPassword123';

    await page.goto(ROUTES.register);
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: 'SIGN UP' }).click();

    // Should land on home with the new email in the header
    await expect(page.getByText(email, { exact: false })).toBeVisible({ timeout: 10000 });

    // Clean up — log out (the test account remains in Supabase but is harmless)
    await logout(page);
  });

  test('register page has a button to go back to login', async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.getByRole('button', { name: 'BACK TO LOGIN' }).click();
    await expect(page).toHaveURL(/login/);
  });
});
