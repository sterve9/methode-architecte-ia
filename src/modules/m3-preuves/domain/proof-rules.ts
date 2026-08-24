/**
 * Domaine M3 — Règles Métier et Transitions du Cycle de Vie des Preuves
 */

import type { ProofStatus } from '../types';

export const VALID_PROOF_STATUS_TRANSITIONS: Record<ProofStatus, ProofStatus[]> = {
  brouillon: ['publié', 'archivé'],
  publié: ['brouillon', 'archivé'],
  archivé: [], // État terminal
};

/**
 * Vérifie si une transition de statut est autorisée.
 */
export function canTransitionProofStatus(
  currentStatus: ProofStatus,
  targetStatus: ProofStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = VALID_PROOF_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Vérifie si un livrable est éligible pour créer une preuve publique.
 * Aligné M2 : statut livrable = 'Publié' (voir DeliverableStatus).
 */
export function isDeliverableEligibleForProof(deliverableStatus: string): boolean {
  const normalized = deliverableStatus.trim().toLowerCase();
  return normalized === 'publié' || normalized === 'publie';
}
