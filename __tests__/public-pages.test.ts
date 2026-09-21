import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

/**
 * DT-S25-02 — La règle « la couche publique ne montre QUE le cas, jamais la
 * méthode » n'est vérifiable à l'œil qu'une fois, le jour où on l'écrit.
 * Ces tests la rendent mesurable : ils rendent réellement les deux pages
 * publiques et vérifient les deux moitiés de la règle — ce qui doit y être,
 * et surtout ce qui ne doit plus jamais y revenir.
 *
 * Les queries M3 sont doublées : rien n'est prouvé ici sur Supabase.
 */

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

const getPublicProofsMock = vi.fn()
const getProofBySlugMock = vi.fn()

vi.mock('@/modules/m3-preuves/queries/get-public-proofs', () => ({
  getPublicProofs: () => getPublicProofsMock(),
}))

vi.mock('@/modules/m3-preuves/queries/get-proof-by-slug', () => ({
  getProofBySlug: (slug: string) => getProofBySlugMock(slug),
}))

vi.mock('@/lib/site-url', () => ({
  resolveSiteUrl: () => 'https://methode.sterveshop.cloud',
}))

// `next/link` exige un contexte de routeur que jsdom n'a pas ; seul le rendu
// de l'ancre nous intéresse ici.
vi.mock('next/link', async () => {
  const { createElement } = await import('react')

  return {
    default: ({
      href,
      children,
      ...rest
    }: {
      href: string
      children: React.ReactNode
    }) => createElement('a', { href, ...rest }, children),
  }
})

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

import PublicPortfolioPage from '@/app/p/page'
import PublicProofPage from '@/app/p/[slug]/page'

/**
 * Le vocabulaire banni de la surface publique. `format` et `context` sont
 * représentés par des valeurs volontairement distinctives dans la fixture :
 * si l'une d'elles réapparaît un jour dans le rendu, le test la nomme.
 */
const BANNED_PATTERN = /méthode|méthodologie|certifié/i
const DEPRECATED_FORMAT = 'Récit de compétence'
const DEPRECATED_CONTEXT = 'Produit pendant la phase MODÉLISER du canevas interne.'

const CASE_STUDY = {
  id: 'proof-1',
  deliverable_id: 'deliverable-1',
  title: 'Un CRM qui relance les prospects tout seul',
  slug: 'crm-prospection-smm',
  summary: 'Fini les prospects oubliés : chaque contact est relancé au bon moment.',
  metier: 'Gestion de réseaux sociaux',
  probleme: 'Aucune conversion malgré un volume de prospects élevé.',
  solution: 'Un CRM qui qualifie chaque prospect et déclenche les relances.',
  resultat: 'Taux de réponse passé de 4 % à 19 % en six semaines.',
  video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  image_url: 'https://example.com/capture.png',
  format: DEPRECATED_FORMAT,
  context: DEPRECATED_CONTEXT,
  status: 'publié' as const,
  published_at: '2026-09-01T10:00:00.000Z',
  created_at: '2026-08-20T10:00:00.000Z',
  updated_at: '2026-09-01T10:00:00.000Z',
  deliverable_title: 'Dépôt du CRM',
  deliverable_url: 'https://github.com/sterve9/crm',
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Vitrine /p
// ---------------------------------------------------------------------------

describe('/p — vitrine', () => {
  test('la carte montre le métier, le titre, le résultat et l’accroche', async () => {
    getPublicProofsMock.mockResolvedValue([CASE_STUDY])

    render(await PublicPortfolioPage())

    expect(screen.getByText(CASE_STUDY.metier)).toBeTruthy()
    expect(screen.getByText(CASE_STUDY.title)).toBeTruthy()
    expect(screen.getByText(CASE_STUDY.resultat)).toBeTruthy()
    expect(screen.getByText(CASE_STUDY.summary)).toBeTruthy()
    expect(screen.getByText(/Lire l'étude de cas/)).toBeTruthy()
  })

  test('la carte pointe vers la fiche du cas', async () => {
    getPublicProofsMock.mockResolvedValue([CASE_STUDY])

    const { container } = render(await PublicPortfolioPage())
    const links = container.querySelectorAll(`a[href="/p/${CASE_STUDY.slug}"]`)

    expect(links.length).toBeGreaterThan(0)
  })

  test('n’expose ni le vocabulaire méthode, ni les champs dépréciés', async () => {
    getPublicProofsMock.mockResolvedValue([CASE_STUDY])

    const { container } = render(await PublicPortfolioPage())
    const html = container.innerHTML

    expect(html).not.toMatch(BANNED_PATTERN)
    expect(html).not.toContain(DEPRECATED_FORMAT)
    expect(html).not.toContain(DEPRECATED_CONTEXT)
  })

  test('les 7 sections attendues sont présentes, dans l’ordre demandé', async () => {
    getPublicProofsMock.mockResolvedValue([CASE_STUDY])

    const { container } = render(await PublicPortfolioPage())
    const html = container.innerHTML

    const ordered = [
      'IA Automation Specialist',
      'Systèmes réels livrés, pas des maquettes',
      'Des problèmes réels, résolus et mesurés',
      'Ce que je peux automatiser pour vous',
      'À propos',
      // Repère propre à la section contact : « Discutons de votre projet »
      // apparaît aussi dans le CTA du hero, et ne situe donc rien.
      'Décrivez-moi la tâche qui vous prend le plus de temps',
      'Systèmes livrés, mesurés, prouvés',
    ]

    const positions = ordered.map((text) => html.indexOf(text))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
  })

  test('les ancres des deux CTA du hero existent bien dans la page', async () => {
    getPublicProofsMock.mockResolvedValue([])

    const { container } = render(await PublicPortfolioPage())

    expect(container.querySelector('#cas')).toBeTruthy()
    expect(container.querySelector('#contact')).toBeTruthy()
  })

  test('les canaux de contact ouverts sont rendus, et aucun lien n’est mort', async () => {
    getPublicProofsMock.mockResolvedValue([CASE_STUDY])

    const { container } = render(await PublicPortfolioPage())

    // Un href="#" sur une page qui invite à écrire est pire qu'un bouton
    // absent : le visiteur clique et il ne se passe rien.
    expect(container.querySelectorAll('a[href="#"]').length).toBe(0)

    expect(
      container.querySelector('a[href="mailto:contact@sterveshop.cloud"]')
    ).toBeTruthy()
    expect(
      container.querySelector('a[href="https://www.linkedin.com/in/sterve-ai/"]')
    ).toBeTruthy()
    expect(
      container.querySelector('a[href="https://www.tiktok.com/@sterve.architecte.ia"]')
    ).toBeTruthy()
    expect(
      container.querySelector('a[href="https://www.youtube.com/@iaarchitecte"]')
    ).toBeTruthy()
  })

  test('un canal pas encore ouvert n’affiche aucun bouton (Nexlance)', async () => {
    getPublicProofsMock.mockResolvedValue([CASE_STUDY])

    const { container } = render(await PublicPortfolioPage())

    expect(container.innerHTML).not.toContain('Nexlance')
  })

  test('les liens sortants du pied de page s’ouvrent en sécurité', async () => {
    getPublicProofsMock.mockResolvedValue([])

    const { container } = render(await PublicPortfolioPage())
    const external = container.querySelectorAll('a[href^="https://"]')

    expect(external.length).toBeGreaterThan(0)
    for (const link of external) {
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  test('sans aucune preuve publiée, la page reste présentable', async () => {
    getPublicProofsMock.mockResolvedValue([])

    const { container } = render(await PublicPortfolioPage())

    expect(screen.getByText(/premières études de cas arrivent/)).toBeTruthy()
    expect(container.innerHTML).not.toMatch(BANNED_PATTERN)
  })

  test('une carte sans métier ni résultat ne casse pas le rendu', async () => {
    getPublicProofsMock.mockResolvedValue([
      { ...CASE_STUDY, metier: null, resultat: null, image_url: null },
    ])

    render(await PublicPortfolioPage())

    expect(screen.getByText(CASE_STUDY.title)).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Fiche /p/[slug]
// ---------------------------------------------------------------------------

function renderCase(overrides: Record<string, unknown> = {}) {
  getProofBySlugMock.mockResolvedValue({ ...CASE_STUDY, ...overrides })
  return PublicProofPage({ params: Promise.resolve({ slug: CASE_STUDY.slug }) })
}

describe('/p/[slug] — étude de cas', () => {
  test('le récit suit l’ordre problème → solution → résultat', async () => {
    const { container } = render(await renderCase())
    const html = container.innerHTML

    const problemeIndex = html.indexOf('Le problème')
    const solutionIndex = html.indexOf("Ce que j'ai construit")
    const resultatIndex = html.indexOf('Le résultat')

    expect(problemeIndex).toBeGreaterThan(-1)
    expect(solutionIndex).toBeGreaterThan(problemeIndex)
    expect(resultatIndex).toBeGreaterThan(solutionIndex)
  })

  test('le contenu des trois sections est bien rendu', async () => {
    render(await renderCase())

    expect(screen.getByText(CASE_STUDY.probleme)).toBeTruthy()
    expect(screen.getByText(CASE_STUDY.solution)).toBeTruthy()
    expect(screen.getByText(CASE_STUDY.resultat)).toBeTruthy()
    expect(screen.getByText(CASE_STUDY.metier)).toBeTruthy()
  })

  test('n’expose ni le vocabulaire méthode, ni les champs dépréciés', async () => {
    const { container } = render(await renderCase())
    const html = container.innerHTML

    expect(html).not.toMatch(BANNED_PATTERN)
    expect(html).not.toContain(DEPRECATED_FORMAT)
    expect(html).not.toContain(DEPRECATED_CONTEXT)
    expect(html).not.toContain('Propulsé par')
  })

  test('la vidéo est intégrée via une URL reconstruite, jamais la saisie brute', async () => {
    const { container } = render(await renderCase())
    const iframe = container.querySelector('iframe')

    expect(iframe).toBeTruthy()
    expect(iframe?.getAttribute('src')).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
    )
  })

  test('une URL vidéo non YouTube n’intègre aucun lecteur', async () => {
    const { container } = render(await renderCase({ video_url: 'https://evil.com/x' }))

    expect(container.querySelector('iframe')).toBeNull()
  })

  test('sans vidéo ni livrable source, aucune section « Voir le système »', async () => {
    const { container } = render(
      await renderCase({ video_url: null, deliverable_url: null })
    )

    expect(container.innerHTML).not.toContain('Voir le système')
  })

  test('le lien vers le livrable source s’ouvre en sécurité', async () => {
    const { container } = render(await renderCase())
    const link = container.querySelector(`a[href="${CASE_STUDY.deliverable_url}"]`)

    expect(link).toBeTruthy()
    expect(link?.getAttribute('rel')).toContain('noopener')
  })

  test('aucun emplacement de témoignage n’est rendu tant qu’il n’y a pas de donnée', async () => {
    const { container } = render(await renderCase())

    expect(container.innerHTML).not.toMatch(/témoignage/i)
  })

  test('le CTA de bas de page renvoie vers le contact', async () => {
    const { container } = render(await renderCase())

    expect(container.querySelector('a[href="/p#contact"]')).toBeTruthy()
  })

  test('un cas incomplet n’affiche que les sections renseignées', async () => {
    const { container } = render(await renderCase({ probleme: null, solution: null }))
    const html = container.innerHTML

    expect(html).not.toContain('Le problème')
    expect(html).not.toContain("Ce que j'ai construit")
    expect(html).toContain('Le résultat')
  })
})
