/**
 * RÈGLES DU JOURNAL D'ÉVÉNEMENTS
 *
 * Source métier : docs/methode/07.Contrats.md (CT-04, CT-10, CT-11)
 * Source technique : docs/technique/decisions.md (DT-Lot5-09)
 *
 * Ce fichier est volontairement pur (aucun accès base, aucun import Next) :
 * c'est lui qui porte la partie testable en Vitest de l'exigence
 * 12.Strategie_Tests.md §166.
 */

import type { EventSourceType, EventType } from '../types'

/**
 * À chaque type d'événement correspond une et une seule table source.
 * Cette table est la contrepartie applicative de la référence polymorphe
 * assumée en base : `source_id` n'ayant pas de clé étrangère, c'est ici que
 * se joue la cohérence du couple (type, source_type).
 */
const SOURCE_TYPE_BY_EVENT: Record<EventType, EventSourceType> = {
  'Projet créé': 'project',
  'Étape terminée': 'method_step',
  'Livrable attaché': 'deliverable',
  'Preuve publiée': 'public_proof',
}

/**
 * Les 4 types d'événements du MVP, dans l'ordre de la chaîne de valeur.
 * Sert de source unique aux tests et à la consultation interne.
 */
export const EVENT_TYPES = Object.keys(SOURCE_TYPE_BY_EVENT) as EventType[]

/**
 * Donne la table source attendue pour un type d'événement.
 * Lève si le type est inconnu : un événement sans source qualifiée serait
 * refusé par la contrainte CHECK en base, autant échouer avant l'aller-retour.
 */
export function sourceTypeForEvent(type: EventType): EventSourceType {
  const sourceType = SOURCE_TYPE_BY_EVENT[type]

  if (!sourceType) {
    throw new Error(`Type d'événement inconnu : '${type}'.`)
  }

  return sourceType
}

/**
 * Préfixe qui identifie les projets créés par le test E2E, qui écrit dans la
 * base de production à chaque exécution (DT-Lot5-02).
 *
 * Le journal étant append-only par conception, ces événements ne peuvent pas
 * être supprimés : ils sont écartés à la lecture, jamais de la base.
 */
export const E2E_PROJECT_PREFIX = '[E2E]'

/**
 * Indique si un événement provient d'un projet de test et doit donc être
 * exclu de la mesure de cadence réelle.
 */
export function isTestEvent(projectName: string): boolean {
  return projectName.startsWith(E2E_PROJECT_PREFIX)
}
