import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/auth.setup.ts',
    },
    {
      name: 'auth-tests',
      testMatch: '**/auth.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState - auth tests manage their own sessions
      },
    },
    {
      name: 'forgotPassword-tests',
      testMatch: '**/forgotPassword.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // No storageState - forgotPassword tests manage their own sessions
      },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testIgnore: ['**/auth.spec.ts', '**/forgotPassword.spec.ts'],
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'cross-env VITE_PLAYWRIGHT=true npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});