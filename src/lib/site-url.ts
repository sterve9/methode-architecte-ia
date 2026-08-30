/**
 * URL publique canonique du système.
 *
 * Met en œuvre `DT-Lot4-03` (aucune URL absolue en base, construction au
 * runtime) et `DT-Lot5-11` (domaine propre `methode.sterveshop.cloud`).
 *
 * Pourquoi une fonction partagée : jusqu'à la S24, deux implémentations
 * coexistaient — `generate-post-draft.ts` résolvait au runtime, alors que
 * `p/[slug]/page.tsx` portait l'URL en dur. Résultat mesuré : les fiches
 * servies sur le nouveau domaine annonçaient l'ancien dans leur `og:url`.
 * Une seule fonction, un seul comportement.
 */

/**
 * Repli utilisé hors Vercel (développement local, tests). C'est l'adresse
 * canonique du site : celle vers laquelle l'ancienne `.vercel.app` redirige.
 */
export const CANONICAL_SITE_URL = 'https://methode.sterveshop.cloud'

/** Base publique absolue, sans barre oblique finale. */
export function resolveSiteUrl(): string {
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return productionUrl ? `https://${productionUrl}` : CANONICAL_SITE_URL
}
