import { describe, expect, test } from 'vitest'

import { isPublicPath } from '@/lib/supabase/middleware'

/**
 * Règle minimale du Lot 1 (12.Strategie_Tests.md §8) :
 * « test unitaire sur la logique de protection des routes privées ».
 *
 * Écrit rétroactivement en S23 : le Lot 1 avait été tagué sans ce test
 * (audit des conditions de sortie du MVP, séance S23). La frontière est
 * déjà couverte par `e2e/acces-public-prive.spec.ts`, mais un E2E ne teste
 * que les routes qu'on a pensé à y écrire ; l'allowlist elle-même mérite
 * d'être éprouvée sur ses cas limites.
 *
 * Contexte : `DT-Lot5-07` — ce proxy n'a jamais tourné pendant cinq lots.
 */

describe('isPublicPath — routes publiques déclarées', () => {
  test.each(['/', '/login', '/p'])('« %s » est public', (path) => {
    expect(isPublicPath(path)).toBe(true)
  })

  test('une fiche de preuve /p/[slug] est publique (CA-05, CT-09)', () => {
    expect(isPublicPath('/p/crm-prospection-smm')).toBe(true)
    expect(isPublicPath('/p/n-importe-quel-slug')).toBe(true)
  })

  test('le callback d’authentification est public, sinon la connexion boucle', () => {
    expect(isPublicPath('/auth/callback')).toBe(true)
  })
})

describe('isPublicPath — tout le reste est privé par défaut', () => {
  test.each([
    '/dashboard',
    '/dashboard/projects',
    '/dashboard/projects/new',
    '/dashboard/diffusion',
    '/dashboard/mesures',
  ])('« %s » est privé', (path) => {
    expect(isPublicPath(path)).toBe(false)
  })

  test('une route inconnue est privée : l’allowlist ne laisse rien passer par défaut', () => {
    expect(isPublicPath('/admin')).toBe(false)
    expect(isPublicPath('/api/secret')).toBe(false)
  })
})

describe('isPublicPath — cas limites du préfixe /p', () => {
  /**
   * Le piège : `/p` est dans PUBLIC_PATHS en correspondance EXACTE, et c'est
   * `/p/` (avec la barre) qui sert de préfixe. Si le préfixe était `/p`, toute
   * route commençant par ces deux caractères deviendrait publique.
   */
  test.each(['/pizza', '/profile', '/projects', '/private'])(
    '« %s » ne devient PAS public à cause du préfixe /p',
    (path) => {
      expect(isPublicPath(path)).toBe(false)
    }
  )

  test('la casse n’ouvre pas de porte dérobée', () => {
    expect(isPublicPath('/P')).toBe(false)
    expect(isPublicPath('/Login')).toBe(false)
  })

  test('une barre finale rend la route privée — le doute profite à la fermeture', () => {
    // Next.js normalise les barres finales avant d'atteindre le proxy ; si la
    // normalisation venait à changer, ce comportement échoue du bon côté.
    expect(isPublicPath('/login/')).toBe(false)
  })
})
