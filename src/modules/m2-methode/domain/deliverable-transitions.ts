/**
 * RÈGLES DE TRANSITION DE STATUT DES LIVRABLES
 *
 * Source métier : docs/methode/05.Cycle_de_Vie.md (Section 8)
 * Source technique : docs/technique/decisions.md (DT-Lot3-02)
 *
 * États : 'Brouillon' | 'Publié'
 *
 * Transitions autorisées (réversibles) :
 * - 'Brouillon' -> 'Publié'
 * - 'Publié' -> 'Brouillon'
 *
 * Transitions interdites :
 * - from === to (strictement interdit, règle S15)
 */

import { DeliverableStatus } from '../types'

const ALLOWED_DELIVERABLE_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
  Brouillon: ['Publié'],
  Publié: ['Brouillon'],
}

/**
 * Indique si une transition de statut de livrable est autorisée.
 */
export function canDeliverableTransition(
  from: DeliverableStatus,
  to: DeliverableStatus
): boolean {
  if (from === to) {
    return false
  }

  const allowedTargets = ALLOWED_DELIVERABLE_TRANSITIONS[from] || []
  return allowedTargets.includes(to)
}

/**
 * Valide une transition de statut de livrable et lève une exception si elle est interdite.
 */
export function assertCanDeliverableTransition(
  from: DeliverableStatus,
  to: DeliverableStatus
): void {
  if (!canDeliverableTransition(from, to)) {
    throw new Error(
      `Transition de livrable interdite : impossible de passer de '${from}' à '${to}'.`
    )
  }
}
