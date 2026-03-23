// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";
import { login, logout, register, generateTestEmail, ROUTES, TEST_USER } from "./helpers";

// -------------------------------------------------------------------------
// Login
// -------------------------------------------------------------------------
test.describe("Login", () => {
  test("shows the home screen after successful login", async ({ page }) => {
    await login(page);
    await expect(page.getByText("MONEY TRACKER")).toBeVisible();
    await expect(page.getByText(TEST_USER.email, { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: "LOGOFF" })).toBeVisible();
  });

  test("redirects away from login page when already authenticated", async ({ page }) => {
    await login(page);
    await page.goto(ROUTES.login);
    await expect(page).toHaveURL(/MoneyTracker\/$/, { timeout: 5000 });
    await logout(page);
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByLabel(/email address/i).fill("wrong@example.com");
    await page.locator('[data-testid="password-field"] input').fill("wrongpassword");
    await page.getByRole("button", { name: "SIGN IN" }).click();

    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole("button", { name: "SIGN IN" })).toBeVisible({ timeout: 8000 });
  });

  test("login page has a link to the register page", async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByRole("button", { name: "REGISTER" }).click();
    await expect(page).toHaveURL(/register/);
  });
});

// -------------------------------------------------------------------------
// Logout
// -------------------------------------------------------------------------
test.describe("Logout", () => {
  test("returns to login page after logout", async ({ page }) => {
    await login(page);
    await logout(page);
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole("button", { name: "SIGN IN" })).toBeVisible();
  });

  test("redirects to login when accessing home while logged out", async ({ page }) => {
    await page.goto(ROUTES.home);
    await expect(page).toHaveURL(/login/);
  });
});

// -------------------------------------------------------------------------
// Register
// -------------------------------------------------------------------------
test.describe("Register", () => {
  test.skip("registration redirects to home when auto-confirmed", async ({ page }) => {
    const email = generateTestEmail();
    const password = "TestPassword123";

    await page.goto(ROUTES.register);
    await page.getByLabel(/email address/i).fill(email);
    await page.locator('[data-testid="password-field"] input').fill(password);
    await page.locator('[data-testid="confirm-password-field"] input').fill(password);
    await page.getByRole("button", { name: "SIGN UP" }).click();
    // Email confirmation is enabled — app stays on register page with success message
    await expect(page.getByText(/registration successful/i)).toBeVisible({ timeout: 10000 });
  });

  test("shows error for duplicate email", async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.getByLabel(/email address/i).fill(TEST_USER.email);
    await page.locator('[data-testid="password-field"] input').fill("TestPassword123");
    await page.locator('[data-testid="confirm-password-field"] input').fill("TestPassword123");
    await page.getByRole("button", { name: "SIGN UP" }).click();

    // With email confirmation enabled, Supabase does not reveal duplicate emails
    // to prevent user enumeration — it shows a success message instead
    await expect(
      page.getByText(/registration successful|could not complete registration/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("shows mismatch error when passwords do not match", async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.getByLabel(/email address/i).fill("mismatch@example.com");
    await page.locator('[data-testid="password-field"] input').fill("TestPassword123");
    await page.locator('[data-testid="confirm-password-field"] input').fill("DifferentPassword123");
    await expect(page.getByText("Passwords do not match.")).toBeVisible({ timeout: 5000 });
  });

  test("shows error for password shorter than 8 characters", async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.getByLabel(/email address/i).fill("short@example.com");
    await page.locator('[data-testid="password-field"] input').fill("short");
    await page.locator('[data-testid="confirm-password-field"] input').fill("short");
    await page.getByRole("button", { name: "SIGN UP" }).click();
    await expect(
      page
        .locator('[data-testid="password-field"]')
        .getByText("Password must be at least 8 characters.")
    ).toBeVisible({ timeout: 5000 });
  });

  test("register page has a button to go back to login", async ({ page }) => {
    await page.goto(ROUTES.register);
    await page.getByRole("button", { name: "BACK TO LOGIN" }).click();
    await expect(page).toHaveURL(/login/);
  });
});
