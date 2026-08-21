/**
 * RÈGLES DE TRANSITION DE STATUT DES ÉTAPES DE MÉTHODE
 *
 * Source métier : docs/methode/05.Cycle_de_Vie.md (Section 7)
 * Source technique : docs/technique/decisions.md (DT-Lot3-02)
 *
 * États : 'À faire' | 'En cours' | 'Terminée'
 *
 * Transitions autorisées :
 * - 'À faire' -> 'En cours'
 * - 'En cours' -> 'Terminée'
 * - 'En cours' -> 'À faire'
 *
 * Transitions interdites :
 * - 'À faire' -> 'Terminée' (saut direct interdit)
 * - 'Terminée' -> tout état (état terminal)
 * - from === to (strictement interdit, leçon S15)
 */

import { MethodStepStatus } from '../types'

const ALLOWED_STEP_TRANSITIONS: Record<MethodStepStatus, MethodStepStatus[]> = {
  'À faire': ['En cours'],
  'En cours': ['Terminée', 'À faire'],
  'Terminée': [], // État terminal
}

/**
 * Indique si une transition de statut est autorisée.
 */
export function canStepTransition(
  from: MethodStepStatus,
  to: MethodStepStatus
): boolean {
  if (from === to) {
    return false
  }

  const allowedTargets = ALLOWED_STEP_TRANSITIONS[from] || []
  return allowedTargets.includes(to)
}

/**
 * Valide une transition de statut et lève une erreur explicite si elle est interdite.
 * À utiliser en garde dans les Server Actions.
 */
export function assertCanStepTransition(
  from: MethodStepStatus,
  to: MethodStepStatus
): void {
  if (!canStepTransition(from, to)) {
    throw new Error(
      `Transition d'étape interdite : impossible de passer de '${from}' à '${to}'.`
    )
  }
}
