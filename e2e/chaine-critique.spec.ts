import { test, expect } from '@playwright/test'

/**
 * Test E2E obligatoire de la chaîne de valeur critique (12.Strategie_Tests.md §4/§8, Lot 4).
 *
 * Parcours couvert : connexion → création d'un Projet → cadrage jusqu'à
 * "En cours" → marquage d'une Étape comme Terminée → attachement d'un
 * Livrable → publication du Livrable → transformation en Preuve publique
 * → consultation de la Preuve sans authentification.
 *
 * Non couvert ici : l'enregistrement des 4 événements clés dans la table
 * `events` (12.Strategie_Tests.md §4 les inclut dans la chaîne critique),
 * car cette table n'existe pas encore — elle est l'objet du Lot 5
 * (voir decisions.md, DT-Lot5-01). Ce test sera étendu à ce moment-là.
 *
 * Nécessite E2E_USER_EMAIL et E2E_USER_PASSWORD dans .env.local, pointant
 * vers l'unique utilisateur du système (DT-Lot1-01 — pas de seed dédié).
 * Voir docs/technique/tests.md.
 *
 * Nettoyage : le projet créé est nommé "[E2E] ..." et archivé par le test
 * lui-même en toute fin de parcours (pas de suppression physique possible
 * par conception, DT-Lot2-01). La preuve publiée est retirée séparément de
 * la vitrine : archiver le projet ne l'en retire pas (DT-Lot5-05).
 */

const E2E_EMAIL = process.env.E2E_USER_EMAIL
const E2E_PASSWORD = process.env.E2E_USER_PASSWORD

test.skip(
  !E2E_EMAIL || !E2E_PASSWORD,
  'E2E_USER_EMAIL et E2E_USER_PASSWORD doivent être définis dans .env.local (voir docs/technique/tests.md).'
)

test('chaîne critique : Projet → Étape → Livrable → Preuve publique → consultation publique', async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000)

  const projectName = `[E2E] Chaîne critique ${Date.now()}`
  const deliverableTitle = `Livrable E2E ${Date.now()}`

  // 1. Connexion
  await page.goto('/login')
  await page.getByLabel('Email').fill(E2E_EMAIL!)
  await page.getByLabel('Mot de passe').fill(E2E_PASSWORD!)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/dashboard/)

  // 2. Création du Projet
  await page.goto('/dashboard/projects/new')
  await page.getByLabel('Nom du projet').fill(projectName)
  await page
    .getByLabel('Problème métier traité')
    .fill('Test automatisé de la chaîne critique (E2E).')
  await page.getByRole('button', { name: 'Créer le projet' }).click()
  await expect(page).toHaveURL('/dashboard/projects')

  // 3. Ouverture du projet créé
  await page.getByRole('link', { name: projectName }).click()
  await expect(page).toHaveURL(/\/dashboard\/projects\/[0-9a-f-]+$/)
  const projectUrl = page.url()

  // 4. Cadrage du projet : Idée → Cadré → En cours
  //    (l'archivage en fin de test n'est possible que depuis En cours/En pause/Livré)
  for (const nextStatus of ['Cadré', 'En cours']) {
    await page.goto(`${projectUrl}/edit`)
    await page.getByLabel('Statut').selectOption(nextStatus)
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(projectUrl)
  }

  // 5. Marquage de la première Étape comme Terminée
  await page.getByRole('button', { name: 'Démarrer' }).first().click()
  await page.getByRole('button', { name: 'Terminer' }).click()
  await expect(page.getByText('Terminée').first()).toBeVisible()

  // 6. Attachement d'un Livrable à cette étape
  await page.getByRole('button', { name: '+ Ajouter un livrable (URL)' }).first().click()
  await page.getByPlaceholder('Titre du livrable (ex: Figma, Repo GitHub...)').fill(deliverableTitle)
  await page.getByPlaceholder('https://...').fill('https://example.com/preuve-e2e')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByText(deliverableTitle)).toBeVisible()

  // 7. Publication du Livrable (prérequis pour devenir Preuve publique, DT-Lot3-02)
  await page.getByRole('button', { name: 'Publier' }).click()
  await expect(page.getByRole('button', { name: '🌟 Preuve publique' })).toBeVisible()

  // 8. Transformation du Livrable en Preuve publique
  //    (le titre du modal n'a pas d'id/htmlFor associé au champ résumé :
  //    on cible le premier textarea du modal, seul champ de ce type ouvert
  //    à cet instant sur la page)
  await page.getByRole('button', { name: '🌟 Preuve publique' }).click()
  await page.locator('textarea').first().fill('Résumé de test automatisé pour la chaîne critique E2E.')
  await page.getByRole('button', { name: 'Publier la preuve 🚀' }).click()

  const proofLink = page.getByRole('link', { name: /Voir \/p\// })
  await expect(proofLink).toBeVisible()
  const proofHref = await proofLink.getAttribute('href')
  expect(proofHref).toBeTruthy()

  // 9. Accessibilité publique de la Preuve, sans authentification (CA-05)
  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()
  await publicPage.goto(`http://localhost:3000${proofHref}`)
  await expect(publicPage.getByText(deliverableTitle).first()).toBeVisible()
  await publicContext.close()

  // 10. Nettoyage (1/2) : retirer la preuve de la vitrine publique.
  //     Indispensable : archiver le projet ne retire PAS sa preuve de /p, qui
  //     liste toutes les preuves `publié` indépendamment du projet. Sans ça,
  //     chaque exécution laisserait une fausse preuve dans le portfolio public.
  await page.goto('/dashboard/diffusion')
  const proofCard = page.locator('li').filter({ hasText: deliverableTitle })
  await proofCard.getByRole('button', { name: 'Retirer de la vitrine' }).click()
  await proofCard.getByRole('button', { name: 'Confirmer' }).click()
  await expect(proofCard).toHaveCount(0)

  // 11. Nettoyage (2/2) : archivage du projet de test (DT-Lot2-01, pas de suppression physique)
  await page.goto(`${projectUrl}/archive`)
  await page
    .getByLabel("Raison de l'archivage")
    .fill('Donnée de test automatisée (E2E) — voir docs/technique/tests.md')
  await page.getByRole('button', { name: 'Archiver définitivement' }).click()
  await expect(page).toHaveURL(projectUrl)
  await expect(page.getByText('Archivé').first()).toBeVisible()
})
