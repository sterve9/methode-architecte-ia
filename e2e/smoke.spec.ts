import { test, expect } from '@playwright/test'

test('smoke test : l application démarre et affiche la page d accueil', async ({ page }) => {
  // 1. Navigation vers la racine
  await page.goto('/')

  // 2. Vérification que le body est visible (l'app a bien rendu du HTML)
  const body = page.locator('body')
  await expect(body).toBeVisible()
})
