import { test, expect, type Page } from '@playwright/test'

/**
 * Tests E2E de la session authentifiée (11.Plan_Implementation.md, Lot 1).
 *
 * Comble deux critères de sortie du Lot 1 restés non mesurés jusqu'à la S24 :
 * « La session persiste après rafraîchissement de page » et « L'utilisateur
 * peut se déconnecter ». Le lot avait été tagué sans eux — la suite était
 * verte, elle testait simplement autre chose (leçon S23).
 *
 * Fichier séparé de chaine-critique.spec.ts pour une raison de fond : ces
 * tests n'écrivent RIEN en base. Ils ne font que lire des pages avec une
 * session, alors que la chaîne critique écrit en production (DT-Lot5-02) et
 * y laisse 4 événements non supprimables par exécution.
 *
 * Nécessite E2E_USER_EMAIL et E2E_USER_PASSWORD dans .env.local, pointant
 * vers l'unique utilisateur du système (DT-Lot1-01). Voir docs/technique/tests.md.
 */

const E2E_EMAIL = process.env.E2E_USER_EMAIL
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD

test.skip(
  !E2E_EMAIL || !E2E_PASSWORD,
  'E2E_USER_EMAIL et E2E_USER_PASSWORD doivent être définis dans .env.local (voir docs/technique/tests.md).'
)

async function seConnecter(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(E2E_EMAIL!)
  await page.getByLabel('Mot de passe').fill(E2E_PASSWORD!)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/dashboard/)
}

test('la session persiste après un rafraîchissement de page', async ({ page }) => {
  await seConnecter(page)

  await page.reload()

  // L'assertion n'est pas triviale : la MÊME url redirige vers /login sans
  // session (verrouillé par acces-public-prive.spec.ts). Y rester après un
  // rechargement prouve donc que la session a survécu.
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: 'Espace personnel' })).toBeVisible()

  // Et elle tient sur une autre route privée atteinte directement par URL,
  // donc servie par le serveur sans navigation client intermédiaire.
  await page.goto('/dashboard/projects')
  await expect(page).toHaveURL(/\/dashboard\/projects$/)
})

test('la déconnexion ferme réellement la session', async ({ page }) => {
  await seConnecter(page)

  await page.getByRole('button', { name: 'Se déconnecter' }).click()
  await expect(page).toHaveURL(/\/login$/)

  // Le vrai critère : la session est morte CÔTÉ SERVEUR, pas seulement
  // l'affichage renvoyé sur /login. Une route privée doit à nouveau rejeter.
  await page.goto('/dashboard/projects')
  await expect(page).toHaveURL(/\/login$/)
})
