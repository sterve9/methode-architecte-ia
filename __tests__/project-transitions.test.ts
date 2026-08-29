import { describe, expect, test } from 'vitest'

import {
  assertCanTransition,
  canTransition,
  getAvailableTransitions,
} from '@/modules/m1-projets/domain/transitions'
import type { ProjectStatus } from '@/modules/m1-projets/types'

/**
 * Règle minimale du Lot 2 (12.Strategie_Tests.md §8) :
 * « tests unitaires sur les règles métier du Projet (statuts, transitions) ».
 *
 * Écrit rétroactivement en S23 : le Lot 2 avait été tagué sans ces tests
 * (audit des conditions de sortie du MVP, séance S23).
 *
 * La matrice attendue est recopiée ici depuis 05.Cycle_de_Vie.md (T1 à T8),
 * SANS importer la table du module testé. C'est la condition pour qu'une
 * modification silencieuse des transitions fasse échouer ce test au lieu de
 * se valider elle-même.
 */

const ALL_STATUSES: ProjectStatus[] = [
  'Idée',
  'Cadré',
  'En cours',
  'En pause',
  'Livré',
  'Archivé',
]

/** Transitions T1 à T8 de 05.Cycle_de_Vie.md, et elles seules. */
const EXPECTED: Record<ProjectStatus, ProjectStatus[]> = {
  'Idée': ['Cadré'], // T1
  'Cadré': ['En cours'], // T2
  'En cours': ['En pause', 'Livré', 'Archivé'], // T3, T5, T7
  'En pause': ['En cours', 'Archivé'], // T4, T8
  'Livré': ['Archivé'], // T6
  'Archivé': [], // état terminal
}

describe('canTransition — matrice complète des 36 couples', () => {
  for (const from of ALL_STATUSES) {
    for (const to of ALL_STATUSES) {
      const expected = EXPECTED[from].includes(to)

      test(`${from} → ${to} : ${expected ? 'autorisée' : 'refusée'}`, () => {
        expect(canTransition(from, to)).toBe(expected)
      })
    }
  }
})

describe('canTransition — invariants du cycle de vie', () => {
  test('conserver le même statut n’est jamais une transition (règle S15)', () => {
    for (const status of ALL_STATUSES) {
      expect(canTransition(status, status)).toBe(false)
    }
  })

  test('« Archivé » est un état terminal : aucune sortie', () => {
    for (const to of ALL_STATUSES) {
      expect(canTransition('Archivé', to)).toBe(false)
    }
  })

  test('aucun saut direct de « Idée » à « En cours » : le cadrage est obligatoire', () => {
    expect(canTransition('Idée', 'En cours')).toBe(false)
  })

  test('un projet ne peut être archivé que depuis En cours, En pause ou Livré', () => {
    const canArchive = ALL_STATUSES.filter((from) => canTransition(from, 'Archivé'))
    expect(canArchive.sort()).toEqual(['En cours', 'En pause', 'Livré'].sort())
  })
})

describe('assertCanTransition', () => {
  test('ne lève pas sur une transition autorisée', () => {
    expect(() => assertCanTransition('Idée', 'Cadré')).not.toThrow()
  })

  test('lève sur une transition interdite, en renvoyant vers la doc métier', () => {
    expect(() => assertCanTransition('Idée', 'Livré')).toThrow(
      /Transition interdite : Idée → Livré/
    )
    expect(() => assertCanTransition('Idée', 'Livré')).toThrow(/05\.Cycle_de_Vie\.md/)
  })
})

describe('getAvailableTransitions', () => {
  test('propose le statut actuel en tête, pour éditer sans changer d’état', () => {
    expect(getAvailableTransitions('En cours')[0]).toBe('En cours')
  })

  test('propose exactement le statut actuel plus ses transitions autorisées', () => {
    for (const from of ALL_STATUSES) {
      expect(getAvailableTransitions(from)).toEqual([from, ...EXPECTED[from]])
    }
  })

  test('un projet archivé ne se voit proposer que lui-même', () => {
    expect(getAvailableTransitions('Archivé')).toEqual(['Archivé'])
  })
})
