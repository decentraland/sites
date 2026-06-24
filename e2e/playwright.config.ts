import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 0 locally so flakes surface immediately; 2 in CI as a safety net for
  // genuine cold-load jitter once the third-party block lands.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 3 : undefined,
  // 60s per test covers the worst case: cold lazy chunk + multi-step journey.
  // expect.timeout absorbs the first assertion after a goto, so specs no
  // longer need ad-hoc { timeout: 15_000 } overrides.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
  },
  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
})
