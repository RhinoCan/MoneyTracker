import { test as setup, expect } from '@playwright/test';
import { ROUTES, TEST_USER } from '../helpers';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.waitForTimeout(500);
  await page.goto(ROUTES.login);
  await page.getByLabel(/email address/i).fill(TEST_USER.email);
  await page.locator('[data-testid="password-field"] input').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'SIGN IN' }).click();
  await expect(page.getByText(TEST_USER.email, { exact: false })).toBeVisible({ timeout: 10000 });
  await page.context().storageState({ path: authFile });
});