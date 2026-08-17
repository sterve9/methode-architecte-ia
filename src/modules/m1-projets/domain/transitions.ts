import type { ProjectStatus } from '../types';

/**
 * Table des transitions autorisées entre statuts de projet.
 *
 * Source de vérité : docs/methode/05.Cycle_de_Vie.md (transitions T1 à T8).
 *
 * Toute modification de cette table doit d'abord être documentée dans
 * la doc métier via un ADR, puis répercutée ici.
 */
const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  'Idée': ['Cadré'],                              // T1
  'Cadré': ['En cours'],                          // T2
  'En cours': ['En pause', 'Livré', 'Archivé'],   // T3, T5, T7
  'En pause': ['En cours', 'Archivé'],            // T4, T8
  'Livré': ['Archivé'],                           // T6
  'Archivé': [],                                  // état terminal, aucune sortie
};

/**
 * Retourne true si la transition from → to est autorisée par la méthode.
 *
 * Cas particulier : from === to retourne true (pas de changement de statut).
 * Cela permet aux Server Actions de recevoir un formulaire avec le même
 * statut sans lever d'erreur (l'utilisateur modifie juste le nom, par ex).
 */
export function canTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Jette une erreur si la transition from → to est interdite.
 *
 * À utiliser dans les Server Actions pour bloquer les tentatives
 * de transitions illégales (formulaire modifié côté client, bug, etc.).
 */
export function assertCanTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transition interdite : ${from} → ${to}. ` +
      `Voir docs/methode/05.Cycle_de_Vie.md pour les transitions autorisées.`,
    );
  }
}

/**
 * Retourne la liste des statuts vers lesquels on peut aller depuis "from".
 * Inclut "from" lui-même (pas de changement).
 *
 * Utilisée par l'UI pour construire dynamiquement les options du <select>
 * de changement de statut.
 */
export function getAvailableTransitions(from: ProjectStatus): ProjectStatus[] {
  return [from, ...ALLOWED_TRANSITIONS[from]];
}
