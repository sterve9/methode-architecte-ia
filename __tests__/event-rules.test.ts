import { describe, expect, test } from 'vitest'

import {
  E2E_PROJECT_PREFIX,
  EVENT_TYPES,
  isTestEvent,
  sourceTypeForEvent,
} from '@/modules/m5-mesures/domain/event-rules'
import type { EventType } from '@/modules/m5-mesures/types'

/**
 * Les 4 événements clés attendus par 11.Plan_Implementation.md (Lot 5).
 * Cette liste est écrite en dur, sans importer le module testé : c'est le
 * seul moyen qu'un oubli ou un renommage côté code fasse échouer le test
 * plutôt que de se propager silencieusement.
 */
const EXPECTED_TYPES = [
  'Projet créé',
  'Étape terminée',
  'Livrable attaché',
  'Preuve publiée',
]

describe('EVENT_TYPES', () => {
  test('couvre exactement les 4 événements clés du Lot 5', () => {
    expect([...EVENT_TYPES].sort()).toEqual([...EXPECTED_TYPES].sort())
  })
})

describe('sourceTypeForEvent', () => {
  test.each([
    ['Projet créé', 'project'],
    ['Étape terminée', 'method_step'],
    ['Livrable attaché', 'deliverable'],
    ['Preuve publiée', 'public_proof'],
  ])('associe « %s » à la table source %s', (type, expected) => {
    expect(sourceTypeForEvent(type as EventType)).toBe(expected)
  })

  test('lève sur un type inconnu plutôt que de laisser passer un événement non qualifié', () => {
    expect(() => sourceTypeForEvent('Projet supprimé' as EventType)).toThrow(
      /Type d'événement inconnu/
    )
  })
})

describe('isTestEvent', () => {
  test('reconnaît un projet créé par le test E2E', () => {
    expect(isTestEvent(`${E2E_PROJECT_PREFIX} Chaîne critique 1756500000000`)).toBe(true)
  })

  test('laisse passer un projet réel', () => {
    expect(isTestEvent('CRM Prospection SMM')).toBe(false)
  })

  test('ne se déclenche pas sur un projet qui mentionne E2E ailleurs que devant', () => {
    expect(isTestEvent('Refonte du harnais [E2E]')).toBe(false)
  })
})
