import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Playwright ne charge pas .env.local automatiquement (contrairement au
// serveur Next.js) : sans ça, E2E_USER_EMAIL/E2E_USER_PASSWORD restent
// invisibles pour le process de test. Voir docs/technique/tests.md.
dotenv.config({ path: '.env.local' })

const baseURL = 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
