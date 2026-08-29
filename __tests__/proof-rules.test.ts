import { describe, expect, test } from 'vitest'

import {
  canTransitionProofStatus,
  isDeliverableEligibleForProof,
} from '@/modules/m3-preuves/domain/proof-rules'
import { generateSlug } from '@/modules/m3-preuves/domain/slug-generator'
import type { ProofStatus } from '@/modules/m3-preuves/types'

/**
 * Règle minimale du Lot 4 (12.Strategie_Tests.md §8) :
 * « tests unitaires sur les règles métier de la Preuve publique
 * (statuts, visibilité) ».
 *
 * Écrit rétroactivement en S23 : le Lot 4 avait été tagué sans ces tests
 * (audit des conditions de sortie du MVP, séance S23).
 */

const PROOF_STATUSES: ProofStatus[] = ['brouillon', 'publié', 'archivé']

// ---------------------------------------------------------------------------
// Transitions de statut
// ---------------------------------------------------------------------------

describe('canTransitionProofStatus', () => {
  test('un brouillon peut être publié ou archivé', () => {
    expect(canTransitionProofStatus('brouillon', 'publié')).toBe(true)
    expect(canTransitionProofStatus('brouillon', 'archivé')).toBe(true)
  })

  test('une preuve publiée peut être retirée de la vitrine ou archivée', () => {
    expect(canTransitionProofStatus('publié', 'brouillon')).toBe(true)
    expect(canTransitionProofStatus('publié', 'archivé')).toBe(true)
  })

  test('« archivé » est terminal : aucune sortie vers un autre statut', () => {
    expect(canTransitionProofStatus('archivé', 'brouillon')).toBe(false)
    expect(canTransitionProofStatus('archivé', 'publié')).toBe(false)
  })

  /**
   * Comportement contre-intuitif et VOLONTAIRE, à l'inverse des transitions de
   * Projet, d'Étape et de Livrable qui refusent from === to : ici, viser le
   * statut courant est autorisé (idempotence).
   *
   * C'est précisément pour cela que `updateProofStatus` ne peut pas se fier au
   * statut cible pour décider d'émettre l'événement « Preuve publiée » : sans
   * garde, republier une preuve déjà publiée la compterait deux fois dans la
   * cadence. C'est `published_at` qui fait foi (DT-Lot5-09).
   */
  test('viser le statut courant est autorisé — idempotence assumée', () => {
    for (const status of PROOF_STATUSES) {
      expect(canTransitionProofStatus(status, status)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Éligibilité d'un livrable à devenir preuve
// ---------------------------------------------------------------------------

describe('isDeliverableEligibleForProof', () => {
  test('un livrable publié est éligible', () => {
    expect(isDeliverableEligibleForProof('Publié')).toBe(true)
  })

  test('un brouillon ne peut pas devenir une preuve publique (DT-Lot3-02)', () => {
    expect(isDeliverableEligibleForProof('Brouillon')).toBe(false)
  })

  test('tolère la casse, les espaces parasites et l’absence d’accent', () => {
    for (const value of ['publié', '  PUBLIÉ  ', 'publie', 'Publie']) {
      expect(isDeliverableEligibleForProof(value)).toBe(true)
    }
  })

  test('refuse une valeur inconnue plutôt que de la laisser passer', () => {
    expect(isDeliverableEligibleForProof('')).toBe(false)
    expect(isDeliverableEligibleForProof('archivé')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Slug canonique — c'est l'URL publique, donc une donnée de visibilité
// ---------------------------------------------------------------------------

describe('generateSlug', () => {
  test('met en minuscules et remplace les espaces par des tirets', () => {
    expect(generateSlug('Document de cadrage initial')).toBe('document-de-cadrage-initial')
  })

  test('supprime les accents plutôt que de les laisser dans une URL', () => {
    expect(generateSlug('Étape terminée')).toBe('etape-terminee')
  })

  test('supprime la ponctuation sans laisser de tirets consécutifs', () => {
    expect(generateSlug('CRM Prospection SMM — De 0 conversion !')).toBe(
      'crm-prospection-smm-de-0-conversion'
    )
  })

  test('produit un slug stable : deux appels sur le même titre donnent le même résultat', () => {
    const title = 'Preuve publique de la chaîne critique'
    expect(generateSlug(title)).toBe(generateSlug(title))
  })

  test('borne la longueur à 80 caractères, taille d’une URL lisible', () => {
    expect(generateSlug('a'.repeat(200))).toHaveLength(80)
  })

  test('retombe sur l’identifiant fourni quand le titre est vide', () => {
    expect(generateSlug('', 'abc123def456')).toBe('preuve-abc123')
  })

  test('retombe sur un suffixe aléatoire quand le titre ne laisse aucun caractère utile', () => {
    expect(generateSlug('!!! ??? ***')).toMatch(/^preuve-[a-z0-9]+$/)
  })

  test('ne renvoie jamais une chaîne vide, quelle que soit l’entrée', () => {
    for (const title of ['', '   ', '///', 'é', 'A']) {
      expect(generateSlug(title).length).toBeGreaterThan(0)
    }
  })
})
