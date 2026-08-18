import type { ProjectStatus } from '../types';

/**
 * Table des transitions autorisées entre statuts de projet.
 *
 * Source de vérité : docs/methode/05.Cycle_de_Vie.md (transitions T1 à T8).
 *
 * Toute modification de cette table doit d'abord être documentée dans
 * la documentation métier, puis répercutée ici.
 */
const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  'Idée': ['Cadré'],                            // T1
  'Cadré': ['En cours'],                        // T2
  'En cours': ['En pause', 'Livré', 'Archivé'], // T3, T5, T7
  'En pause': ['En cours', 'Archivé'],          // T4, T8
  'Livré': ['Archivé'],                         // T6
  'Archivé': [],                                // état terminal
};

/**
 * Retourne true uniquement si from → to est une véritable transition
 * autorisée par la méthode.
 *
 * Conserver le même statut n'est pas une transition et retourne false.
 */
export function canTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): boolean {
  if (from === to) {
    return false;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Jette une erreur si from → to n'est pas une véritable transition
 * autorisée par la méthode.
 *
 * Le maintien du même statut est également refusé. L'appelant qui autorise
 * une mise à jour sans changement de statut doit éviter d'appeler cette
 * fonction lorsque from === to.
 */
export function assertCanTransition(
  from: ProjectStatus,
  to: ProjectStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transition interdite : ${from} → ${to}. ` +
      'Voir docs/methode/05.Cycle_de_Vie.md pour les transitions autorisées.',
    );
  }
}

/**
 * Retourne les valeurs proposées dans le select d'édition :
 * - le statut actuel, pour modifier le contenu sans changer d'état ;
 * - les véritables transitions autorisées depuis ce statut.
 */
export function getAvailableTransitions(from: ProjectStatus): ProjectStatus[] {
  return [from, ...ALLOWED_TRANSITIONS[from]];
}
