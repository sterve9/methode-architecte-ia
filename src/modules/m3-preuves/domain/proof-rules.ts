/**
 * Domaine M3 — Règles Métier et Transitions du Cycle de Vie des Preuves
 */

import type { CaseStudyFields, ProofStatus } from '../types';

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

// ---------------------------------------------------------------------------
// Complétude de l'étude de cas (DT-S25-02)
// ---------------------------------------------------------------------------

/**
 * Les 4 champs sans lesquels une étude de cas ne dit rien à un client.
 * Ordre volontaire : c'est celui du récit (pour qui → quel problème →
 * quoi construit → quel résultat), donc celui du message d'erreur.
 *
 * `video_url` et `image_url` en sont volontairement ABSENTS : recommandés,
 * jamais bloquants — un cas peut être vrai et utile sans démonstration filmée.
 */
export const REQUIRED_CASE_STUDY_FIELDS = [
  'metier',
  'probleme',
  'solution',
  'resultat',
] as const;

export type RequiredCaseStudyField = (typeof REQUIRED_CASE_STUDY_FIELDS)[number];

/** Libellés lisibles, pour les messages rendus à l'utilisateur. */
export const CASE_STUDY_FIELD_LABELS: Record<RequiredCaseStudyField, string> = {
  metier: 'Métier / cible',
  probleme: 'Problème client',
  solution: 'Solution construite',
  resultat: 'Résultat obtenu',
};

/**
 * Renvoie la liste des champs d'étude de cas manquants.
 *
 * « Manquant » = absent, null, ou vide une fois les espaces retirés. Une
 * chaîne d'espaces n'est pas un contenu : c'est précisément ce qu'une
 * contrainte NOT NULL en base aurait laissé passer, et la raison pour
 * laquelle la garantie vit ici (option A de DT-S25-02).
 *
 * Fonction pure : évaluable sur un état candidat (ligne en base + patch
 * d'édition) avant toute écriture.
 */
export function getMissingCaseStudyFields(
  proof: CaseStudyFields
): RequiredCaseStudyField[] {
  return REQUIRED_CASE_STUDY_FIELDS.filter((field) => {
    const value = proof[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

/**
 * Une preuve ne peut basculer en `publié` que si son étude de cas est complète.
 *
 * Un brouillon incomplet reste parfaitement autorisé : seul le passage en
 * public est verrouillé. La vitrine ne doit jamais afficher un cas à trous.
 */
export function isProofPublishable(proof: CaseStudyFields): boolean {
  return getMissingCaseStudyFields(proof).length === 0;
}

/**
 * Message d'erreur nommant les champs à remplir, ou null si publiable.
 * Centralisé ici pour que les deux points d'écriture (updateProof et
 * updateProofStatus) refusent la publication avec exactement le même motif.
 */
export function getPublicationBlockingReason(proof: CaseStudyFields): string | null {
  const missing = getMissingCaseStudyFields(proof);
  if (missing.length === 0) return null;

  const labels = missing.map((field) => CASE_STUDY_FIELD_LABELS[field]).join(', ');
  return `Étude de cas incomplète : ${labels}. Une preuve ne peut être publiée qu'avec un cas complet.`;
}
