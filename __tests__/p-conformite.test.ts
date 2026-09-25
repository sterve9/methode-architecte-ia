import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { afterEach, describe, expect, test, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

import { CONTACT_LINKS } from '@/lib/contact'
import type { PublicProof } from '@/modules/m3-preuves/types'

/**
 * Conformité de /p à la maquette validée — docs/specs/SPEC-p.md.
 *
 * Un test par point S1 à S9 (et par règle globale), nommé avec son numéro.
 * Ces tests MESURENT l'écart : un test rouge désigne un élément de la maquette
 * absent de src/app/p/page.tsx, pas un défaut du test. Les points que la SPEC
 * laisse ambigus ne sont pas testés ici plutôt qu'inventés.
 *
 * Les queries M3 sont doublées, avec une preuve publiée : rien n'est prouvé
 * ici sur Supabase. Mêmes doubles que __tests__/public-pages.test.ts.
 */

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

const getPublicProofsMock = vi.fn()

vi.mock('@/modules/m3-preuves/queries/get-public-proofs', () => ({
  getPublicProofs: () => getPublicProofsMock(),
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

import PublicPortfolioPage from '@/app/p/page'

/** Une preuve publiée, au format exact de la vue `public_proofs`. */
const PUBLISHED_PROOF: PublicProof = {
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
  format: 'Récit de compétence',
  context: null,
  status: 'publié',
  published_at: '2026-09-01T10:00:00.000Z',
  created_at: '2026-08-20T10:00:00.000Z',
  updated_at: '2026-09-01T10:00:00.000Z',
}

const CARD_HREF = `/p/${PUBLISHED_PROOF.slug}`

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

async function renderPage() {
  getPublicProofsMock.mockResolvedValue([PUBLISHED_PROOF])
  return render(await PublicPortfolioPage())
}

/** Texte normalisé : espaces (insécables compris) réduits à un seul. */
function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** L'élément le plus profond dont le texte correspond au motif. */
function deepest(root: Element, pattern: RegExp): Element | null {
  const matches = [...root.querySelectorAll('*')].filter((el) => pattern.test(text(el)))
  return (
    matches.find((el) => ![...el.children].some((child) => pattern.test(text(child)))) ??
    null
  )
}

/**
 * Le conteneur d'une liste d'items, sans présumer du balisage : le plus proche
 * ancêtre commun des éléments qui portent les libellés. Ses enfants directs
 * sont les items.
 */
function commonAncestor(elements: Element[]): Element | null {
  if (elements.length === 0) return null
  let candidate: Element | null = elements[0].parentElement
  while (candidate && !elements.every((el) => candidate!.contains(el))) {
    candidate = candidate.parentElement
  }
  return candidate
}

function findItems(root: Element, patterns: RegExp[]) {
  const found = patterns
    .map((pattern) => deepest(root, pattern))
    .filter((el): el is Element => el !== null)
  const container = commonAncestor(found)
  return { found, items: container ? [...container.children] : [] }
}

/** La nav du haut : toute nav qui n'est pas celle du pied de page. */
function topNav(container: HTMLElement): Element | null {
  return [...container.querySelectorAll('nav')].find((nav) => !nav.closest('footer')) ?? null
}

/** La section qui porte les études de cas : celle qui contient la carte réelle. */
function casesSection(container: HTMLElement): Element | null {
  return container.querySelector(`a[href="${CARD_HREF}"]`)?.closest('[id]') ?? null
}

function hero(container: HTMLElement): Element | null {
  const h1 = container.querySelector('h1')
  return h1?.closest('section') ?? h1?.parentElement ?? null
}

function sectionTitled(container: HTMLElement, title: RegExp): Element | null {
  const heading = [...container.querySelectorAll('h1, h2, h3')].find((h) =>
    title.test(text(h))
  )
  return heading?.closest('section') ?? null
}

function linkByText(root: Element, label: RegExp): HTMLAnchorElement | null {
  return (
    [...root.querySelectorAll('a')].find((a) => label.test(text(a))) ?? null
  )
}

const APOS = "['’]"

// ---------------------------------------------------------------------------
// Règles globales
// ---------------------------------------------------------------------------

describe('/p — règles globales', () => {
  test('G — accent vert #15803d, token unique', async () => {
    const css = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8')
    expect(css).toMatch(/--accent:\s*#15803d/i)

    const { container } = await renderPage()
    const html = container.innerHTML

    // Aucune couleur de vert codée en dur à côté du token.
    expect(html).not.toMatch(
      /\b(?:bg|text|border|from|via|to|ring|fill|stroke|outline|decoration)-(?:green|emerald|lime|teal)-\d{2,3}\b/
    )
    expect(html).not.toMatch(/-\[#[0-9a-f]{3,8}\]/i)
    for (const el of container.querySelectorAll('[style]')) {
      expect(el.getAttribute('style')).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i)
    }
  })

  test('G — aucune mention « Togo »', async () => {
    const { container } = await renderPage()
    expect(container.innerHTML).not.toMatch(/togo/i)
  })

  // « aucun mot méthode » : déjà couvert par __tests__/public-pages.test.ts.

  test('G — Nexlance absent tant que null dans contact.ts', async () => {
    const nexlance = CONTACT_LINKS.find((link) => link.label === 'Nexlance')
    const { container } = await renderPage()

    if (nexlance?.href === null) {
      expect(container.innerHTML).not.toContain('Nexlance')
    } else {
      expect(container.innerHTML).toContain('Nexlance')
    }
  })
})

// ---------------------------------------------------------------------------
// S1 à S9
// ---------------------------------------------------------------------------

describe('/p — conformité à la maquette (SPEC-p)', () => {
  // S1 -----------------------------------------------------------------------

  test('S1 — nav collante en haut de page', async () => {
    const { container } = await renderPage()
    const nav = topNav(container)
    expect(nav, 'aucune nav hors du pied de page').not.toBeNull()

    // Collante : la nav ou un de ses ancêtres est en position sticky, top 0.
    let sticky = false
    for (let el: Element | null = nav; el && el !== container; el = el.parentElement) {
      const cls = el.getAttribute('class') ?? ''
      const style = (el as HTMLElement).style
      const isSticky = /(^|\s)sticky(\s|$)/.test(cls) || style.position === 'sticky'
      const isTop = /(^|\s)top-0(\s|$)/.test(cls) || style.top === '0px' || style.top === '0'
      if (isSticky && isTop) sticky = true
    }
    expect(sticky, 'nav non collante (sticky + top-0)').toBe(true)

    // En haut : avant le titre du hero.
    const h1 = container.querySelector('h1')!
    expect(
      nav!.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING,
      'la nav n’est pas au-dessus du hero'
    ).toBeTruthy()
  })

  test('S1 — liens Études de cas · Services · À propos · Contact', async () => {
    const { container } = await renderPage()
    const nav = topNav(container)
    expect(nav, 'aucune nav hors du pied de page').not.toBeNull()

    for (const label of [/^Études de cas$/i, /^Services$/i, /^À propos$/i, /^Contact$/i]) {
      expect(linkByText(nav!, label), `lien ${label} absent de la nav`).not.toBeNull()
    }
  })

  test('S1 — bouton « Discutons de votre projet » dans la nav', async () => {
    const { container } = await renderPage()
    const nav = topNav(container)
    expect(nav, 'aucune nav hors du pied de page').not.toBeNull()

    const button = [...nav!.querySelectorAll('a, button')].find((el) =>
      /^Discutons de votre projet$/i.test(text(el))
    )
    expect(button, 'bouton absent de la nav').toBeTruthy()
  })

  test('S1 — chaque lien de la nav pointe vers un id existant de la page', async () => {
    const { container } = await renderPage()
    const nav = topNav(container)
    expect(nav, 'aucune nav hors du pied de page').not.toBeNull()

    for (const label of [/^Études de cas$/i, /^Services$/i, /^À propos$/i, /^Contact$/i]) {
      const href = linkByText(nav!, label)?.getAttribute('href') ?? ''
      expect(href, `lien ${label} : href non ancré`).toMatch(/^#.+/)
      expect(container.querySelector(href), `lien ${label} : ${href} sans cible`).not.toBeNull()
    }
  })

  // S2 -----------------------------------------------------------------------

  test('S2 — titre du hero', async () => {
    const { container } = await renderPage()
    expect(text(container.querySelector('h1'))).toContain(
      'Je construis des systèmes IA qui font gagner des heures aux indépendants et petites entreprises'
    )
  })

  test('S2 — sous-titre sous le titre', async () => {
    const { container } = await renderPage()
    const h1 = container.querySelector('h1')!
    const subtitle = [...hero(container)!.querySelectorAll('p')].find(
      (p) =>
        h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING && text(p).length > 0
    )
    expect(subtitle, 'aucun sous-titre après le h1').toBeTruthy()
  })

  test('S2 — 2 CTA : vers #contact et vers les cas', async () => {
    const { container } = await renderPage()
    const section = hero(container)!
    const cases = casesSection(container)
    expect(cases?.id, 'section des cas sans id').toBeTruthy()

    expect(section.querySelector('a[href="#contact"]'), 'CTA vers #contact').not.toBeNull()
    expect(section.querySelector(`a[href="#${cases!.id}"]`), 'CTA vers les cas').not.toBeNull()
  })

  test('S2 — note « exemple réel : 2 h/jour → 25 leads en 2 min »', async () => {
    const { container } = await renderPage()
    expect(text(hero(container))).toMatch(/exemple réel ?: ?2 h\/jour → 25 leads en 2 min/i)
  })

  // S3 -----------------------------------------------------------------------

  const TRUST_LABELS = [
    /systèmes réels livrés/i,
    /résultats mesurés/i,
    /disponible à distance/i,
    /livraison rapide/i,
  ]

  test('S3 — bandeau de confiance de 4 items', async () => {
    const { container } = await renderPage()
    const { items } = findItems(container.querySelector('main')!, TRUST_LABELS)
    expect(items.length).toBe(4)
  })

  test('S3 — systèmes réels livrés · résultats mesurés · disponible à distance · livraison rapide', async () => {
    const { container } = await renderPage()
    const main = container.querySelector('main')!

    for (const label of TRUST_LABELS) {
      expect(deepest(main, label), `item ${label} absent`).not.toBeNull()
    }
  })

  // S4 -----------------------------------------------------------------------

  const PREPARED = [/avocat/i, /commerce local/i, /comptable/i, /coach/i, /agence/i]

  /** Les cartes = enfants directs de la grille qui contient la carte réelle. */
  function cards(container: HTMLElement): Element[] {
    const grid = container.querySelector(`a[href="${CARD_HREF}"]`)?.closest('[class~="grid"]')
    return grid ? [...grid.children] : []
  }

  test('S4 — grille de 6 cartes avec 1 preuve publiée', async () => {
    const { container } = await renderPage()
    expect(cards(container).length).toBe(6)
  })

  test('S4 — la carte réelle figure dans la grille', async () => {
    const { container } = await renderPage()
    const real = cards(container).filter((card) => card.querySelector(`a[href="${CARD_HREF}"]`))
    expect(real.length).toBe(1)
  })

  test('S4 — 5 cartes « en préparation » : avocat · commerce local · comptable · coach · agence', async () => {
    const { container } = await renderPage()
    const prepared = cards(container).filter((card) => /en préparation/i.test(text(card)))
    expect(prepared.length, 'cartes « en préparation »').toBe(5)

    for (const metier of PREPARED) {
      expect(
        prepared.some((card) => metier.test(text(card))),
        `carte en préparation ${metier} absente`
      ).toBe(true)
    }
  })

  // S5 -----------------------------------------------------------------------

  test('S5 — anatomie d’une fiche : 01 Problème · 02 Ce que j’ai construit · 03 Résultat · 04 Preuve', async () => {
    const { container } = await renderPage()
    expect(text(container.querySelector('main'))).toMatch(
      new RegExp(
        `01\\s*Problème[\\s\\S]*?02\\s*Ce que j${APOS}ai construit[\\s\\S]*?03\\s*Résultat[\\s\\S]*?04\\s*Preuve`,
        'i'
      )
    )
  })

  // S6 -----------------------------------------------------------------------

  test('S6 — services, 3 items : prospection · relances & suivi client · sur mesure', async () => {
    const { container } = await renderPage()
    const labels = [
      /^systèmes de prospection$/i,
      /^relances & suivi client$/i,
      /^automatisations sur mesure$/i,
    ]
    const { found, items } = findItems(container.querySelector('main')!, labels)

    expect(found.length, 'libellés de services trouvés').toBe(3)
    expect(items.length).toBe(3)
  })

  // S7 -----------------------------------------------------------------------

  test('S7 — À propos contient « chaque projet est une preuve, pas une promesse »', async () => {
    const { container } = await renderPage()
    const about = sectionTitled(container, /^À propos$/i)
    expect(about, 'section À propos absente').not.toBeNull()
    expect(text(about)).toMatch(/chaque projet est une preuve, pas une promesse/i)
  })

  // S8 -----------------------------------------------------------------------

  test('S8 — contact : M’écrire (email) · LinkedIn ; pas de Nexlance', async () => {
    const { container } = await renderPage()
    const contact = container.querySelector('#contact')
    expect(contact, 'section #contact absente').not.toBeNull()

    const email = linkByText(contact!, new RegExp(`^M${APOS}écrire$`, 'i'))
    expect(email?.getAttribute('href'), 'lien M’écrire').toMatch(/^mailto:/)

    const linkedin = linkByText(contact!, /^LinkedIn$/i)
    expect(linkedin?.getAttribute('href'), 'lien LinkedIn').toMatch(/linkedin\.com/)

    expect(text(contact)).not.toMatch(/nexlance/i)
  })

  // S9 -----------------------------------------------------------------------

  test('S9 — footer structuré présent', async () => {
    const { container } = await renderPage()
    const footer = container.querySelector('footer')
    expect(footer, 'footer absent').not.toBeNull()

    expect(footer!.querySelector('img[alt="Sterveshop"]'), 'logo').not.toBeNull()
    expect(footer!.querySelector('nav'), 'colonne Naviguer').not.toBeNull()
    expect(text(footer)).toContain('Naviguer')
    expect(text(footer)).toContain('Me joindre')
    expect(text(footer)).toContain('© 2026 Sterveshop · Architecte IA')
    expect(footer!.querySelector('a[href="#haut"]'), 'retour haut de page').not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Décisions cycle 2 (SPEC-p.md, « Décisions cycle 2 »)
// ---------------------------------------------------------------------------

describe('/p — décisions cycle 2', () => {
  async function renderWith(proofs: PublicProof[]) {
    getPublicProofsMock.mockResolvedValue(proofs)
    return render(await PublicPortfolioPage())
  }

  /** La grille des cas, repérée depuis #cas : elle existe même sans preuve. */
  function casesGrid(container: HTMLElement): Element | null {
    return container.querySelector('#cas')?.querySelector('[class~="grid"]') ?? null
  }

  test('D1 — S5 porte le titre visible « Ce que contient chaque étude de cas »', async () => {
    const { container } = await renderWith([PUBLISHED_PROOF])
    const section = sectionTitled(container, /^Ce que contient chaque étude de cas$/)
    expect(section, 'section au titre exact absente').not.toBeNull()

    expect(text(section)).toMatch(
      new RegExp(
        `01\\s*Problème[\\s\\S]*?02\\s*Ce que j${APOS}ai construit[\\s\\S]*?03\\s*Résultat[\\s\\S]*?04\\s*Preuve`,
        'i'
      )
    )
  })

  test('D2 — cartes réelles d’abord, puis les 5 cartes « en préparation »', async () => {
    const { container } = await renderWith([PUBLISHED_PROOF])
    const cards = [...(casesGrid(container)?.children ?? [])]
    expect(cards.length).toBe(6)

    expect(cards[0].querySelector(`a[href="${CARD_HREF}"]`), 'carte réelle en tête').not.toBeNull()
    for (const card of cards.slice(1)) {
      expect(text(card)).toMatch(/en préparation/i)
      expect(card.querySelector(`a[href="${CARD_HREF}"]`)).toBeNull()
    }
  })

  test('D3 — sans preuve publiée, les 5 cartes statiques s’affichent', async () => {
    const { container } = await renderWith([])
    const cards = [...(casesGrid(container)?.children ?? [])]
    expect(cards.length).toBe(5)

    for (const card of cards) {
      expect(text(card)).toMatch(/en préparation/i)
    }
  })

  test('D4 — cibles exactes des liens de la nav', async () => {
    const { container } = await renderWith([PUBLISHED_PROOF])
    const nav = topNav(container)
    expect(nav, 'aucune nav hors du pied de page').not.toBeNull()

    const expected: [RegExp, string][] = [
      [/^Études de cas$/i, '#cas'],
      [/^Services$/i, '#services'],
      [/^À propos$/i, '#demarche'],
      [/^Contact$/i, '#contact'],
    ]
    for (const [label, href] of expected) {
      expect(linkByText(nav!, label)?.getAttribute('href'), `lien ${label}`).toBe(href)
    }

    // Chaque cible est bien la section attendue.
    expect(text(container.querySelector('#services'))).toMatch(/systèmes de prospection/i)
    expect(text(container.querySelector('#demarche'))).toMatch(/^À propos/)
  })
})
