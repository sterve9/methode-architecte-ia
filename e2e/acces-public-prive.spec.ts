import { test, expect } from '@playwright/test'

/**
 * Test E2E de la frontière public / privé (DT-Lot5-07).
 *
 * Verrouille le comportement du proxy (`src/proxy.ts` + l'allowlist de
 * `src/lib/supabase/middleware.ts`) :
 * - la vitrine publique reste atteignable SANS authentification (CA-05, CT-09) ;
 * - toute route du dashboard redirige vers /login pour un anonyme.
 *
 * Pourquoi un fichier à part de `chaine-critique.spec.ts` : ce test n'a besoin
 * d'aucun compte. Le placer dans la chaîne critique le soumettrait à son
 * `test.skip()` global sur E2E_USER_EMAIL/E2E_USER_PASSWORD, et il serait
 * silencieusement sauté dès que ces variables manquent — exactement le type de
 * faux vert que ce test existe pour éliminer.
 *
 * Ces tests n'écrivent rien en base : ils ne consomment que des routes en
 * lecture, sans session (contrairement à la chaîne critique, qui écrit en prod
 * — DT-Lot5-02).
 *
 * Historique : avant DT-Lot5-07, `proxy.ts` vivait à la racine du dépôt alors
 * que l'app est sous `src/`. Next.js 16 ne le chargeait donc jamais, et
 * `/dashboard/projects` répondait 500 (permission denied côté Postgres) au lieu
 * de rediriger. Voir DT-Lot5-06 pour le constat d'origine.
 */

test.describe('frontière public / privé, sans authentification', () => {
  test('la vitrine /p est accessible à un visiteur anonyme', async ({ page }) => {
    await page.goto('/p')

    // Pas de redirection : on est bien resté sur /p
    await expect(page).toHaveURL(/\/p$/)
    await expect(
      page.getByRole('heading', { name: 'Récits de Compétences & Preuves' })
    ).toBeVisible()
  })

  test('une fiche de preuve /p/[slug] est accessible à un visiteur anonyme', async ({
    page,
  }) => {
    await page.goto('/p')

    // On écarte les preuves éphémères publiées par chaine-critique.spec.ts :
    // elle les retire en fin de parcours, et en exécution parallèle on
    // tomberait sur un 404 au milieu de ce test.
    const firstProof = page
      .locator('article')
      .filter({ hasNotText: 'Livrable E2E' })
      .locator('a[href^="/p/"]')
      .first()

    test.skip(
      (await firstProof.count()) === 0,
      'Aucune preuve publique durable sur la vitrine : rien à consulter.'
    )

    const href = await firstProof.getAttribute('href')
    await page.goto(href!)

    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expect(page.locator('h1')).toBeVisible()
  })

  for (const privatePath of [
    '/dashboard',
    '/dashboard/projects',
    '/dashboard/projects/new',
    '/dashboard/diffusion',
  ]) {
    test(`${privatePath} redirige un visiteur anonyme vers /login`, async ({ page }) => {
      await page.goto(privatePath)
      await expect(page).toHaveURL(/\/login$/)
    })
  }
})
