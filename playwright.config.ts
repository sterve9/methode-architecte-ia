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
  // Un seul worker, y compris en local. Le système n'a qu'UN compte
  // (DT-Lot1-01) : tous les tests authentifiés partagent donc la même
  // session. Or `signOut()` de Supabase est global par défaut — il révoque
  // les jetons sur toutes les sessions ouvertes. Deux specs authentifiées en
  // parallèle se coupent l'herbe sous le pied (constaté en S24 : le test de
  // déconnexion tuait la session du test de persistance).
  workers: 1,
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
