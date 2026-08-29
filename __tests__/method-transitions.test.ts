import { describe, expect, test } from 'vitest'

import {
  assertCanDeliverableTransition,
  canDeliverableTransition,
} from '@/modules/m2-methode/domain/deliverable-transitions'
import {
  assertCanStepTransition,
  canStepTransition,
} from '@/modules/m2-methode/domain/step-transitions'
import type { DeliverableStatus, MethodStepStatus } from '@/modules/m2-methode/types'

/**
 * Règle minimale du Lot 3 (12.Strategie_Tests.md §8) :
 * « tests unitaires sur les règles métier des Étapes et Livrables ».
 *
 * Écrit rétroactivement en S23 : le Lot 3 avait été tagué sans ces tests
 * (audit des conditions de sortie du MVP, séance S23).
 *
 * Les matrices attendues sont recopiées depuis 05.Cycle_de_Vie.md §7 et §8,
 * sans importer les tables du code testé.
 */

// ---------------------------------------------------------------------------
// Étapes de méthode — 05.Cycle_de_Vie.md §7
// ---------------------------------------------------------------------------

const STEP_STATUSES: MethodStepStatus[] = ['À faire', 'En cours', 'Terminée']

const EXPECTED_STEP: Record<MethodStepStatus, MethodStepStatus[]> = {
  'À faire': ['En cours'],
  'En cours': ['Terminée', 'À faire'],
  'Terminée': [],
}

describe('canStepTransition — matrice complète', () => {
  for (const from of STEP_STATUSES) {
    for (const to of STEP_STATUSES) {
      const expected = EXPECTED_STEP[from].includes(to)

      test(`${from} → ${to} : ${expected ? 'autorisée' : 'refusée'}`, () => {
        expect(canStepTransition(from, to)).toBe(expected)
      })
    }
  }
})

describe('canStepTransition — invariants', () => {
  test('aucun saut direct de « À faire » à « Terminée » : l’étape doit être démarrée', () => {
    expect(canStepTransition('À faire', 'Terminée')).toBe(false)
  })

  test('« Terminée » est terminal : une étape terminée ne se rouvre pas', () => {
    for (const to of STEP_STATUSES) {
      expect(canStepTransition('Terminée', to)).toBe(false)
    }
  })

  test('une étape démarrée par erreur peut revenir à « À faire »', () => {
    expect(canStepTransition('En cours', 'À faire')).toBe(true)
  })

  test('conserver le même statut n’est jamais une transition (règle S15)', () => {
    for (const status of STEP_STATUSES) {
      expect(canStepTransition(status, status)).toBe(false)
    }
  })
})

describe('assertCanStepTransition', () => {
  test('ne lève pas sur une transition autorisée', () => {
    expect(() => assertCanStepTransition('En cours', 'Terminée')).not.toThrow()
  })

  test('lève avec les deux statuts en clair sur une transition interdite', () => {
    expect(() => assertCanStepTransition('À faire', 'Terminée')).toThrow(
      /impossible de passer de 'À faire' à 'Terminée'/
    )
  })
})

// ---------------------------------------------------------------------------
// Livrables — 05.Cycle_de_Vie.md §8
// ---------------------------------------------------------------------------

const DELIVERABLE_STATUSES: DeliverableStatus[] = ['Brouillon', 'Publié']

describe('canDeliverableTransition', () => {
  test('la publication d’un livrable est réversible dans les deux sens', () => {
    expect(canDeliverableTransition('Brouillon', 'Publié')).toBe(true)
    expect(canDeliverableTransition('Publié', 'Brouillon')).toBe(true)
  })

  test('conserver le même statut n’est jamais une transition (règle S15)', () => {
    for (const status of DELIVERABLE_STATUSES) {
      expect(canDeliverableTransition(status, status)).toBe(false)
    }
  })
})

describe('assertCanDeliverableTransition', () => {
  test('ne lève pas sur une transition autorisée', () => {
    expect(() => assertCanDeliverableTransition('Brouillon', 'Publié')).not.toThrow()
  })

  test('lève sur une republication à l’identique', () => {
    expect(() => assertCanDeliverableTransition('Publié', 'Publié')).toThrow(
      /Transition de livrable interdite/
    )
  })
})
