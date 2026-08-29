/**
 * Types du module M5 - Mesures (Instrumentation)
 *
 * Sources métier :
 * - docs/methode/07.Contrats.md (CT-04, CT-10, CT-11)
 * - docs/methode/11.Plan_Implementation.md (Lot 5)
 * Sources techniques :
 * - docs/technique/decisions.md (DT-Lot5-01, DT-Lot5-09)
 * - supabase/migrations/20260829233704_create_events_table.sql
 */

// ============================================================================
// Enums métier
// ============================================================================

/**
 * Les 4 événements clés du MVP (11.Plan_Implementation.md, Lot 5).
 * Les libellés sont ceux stockés en base : la contrainte CHECK
 * `events_type_check` en est le miroir exact.
 */
export type EventType =
  | 'Projet créé'
  | 'Étape terminée'
  | 'Livrable attaché'
  | 'Preuve publiée';

/**
 * Table d'origine de l'objet source d'un événement.
 * Qualifie `source_id`, qui est une référence polymorphe sans clé étrangère
 * (voir DT-Lot5-09). Miroir de la contrainte `events_source_type_check`.
 */
export type EventSourceType =
  | 'project'
  | 'method_step'
  | 'deliverable'
  | 'public_proof';

// ============================================================================
// Objets métier
// ============================================================================

/**
 * Un événement du journal, tel que stocké.
 */
export type ProjectEvent = {
  id: string;
  type: EventType;
  source_type: EventSourceType;
  source_id: string;
  project_id: string;
  occurred_at: string;
};

// ============================================================================
// Contrats d'entrée / sortie du module
// ============================================================================

/**
 * Charge utile reçue par recordEvent().
 *
 * `sourceType` n'y figure pas volontairement : il est déduit du type
 * d'événement par le domaine (voir domain/event-rules.ts), ce qui rend
 * impossible un couple type/source incohérent au niveau des appelants.
 *
 * Correspond aux données envoyées par CT-04, CT-10 et CT-11.
 */
export type RecordEventInput = {
  type: EventType;
  sourceId: string;
  projectId: string;
};

/**
 * Retour de recordEvent() — le « Confirmation d'enregistrement » attendu
 * par CT-04, CT-10 et CT-11.
 *
 * recordEvent() ne lève jamais : l'instrumentation ne doit en aucun cas
 * casser l'action métier qu'elle observe (voir DT-Lot5-09).
 */
export type RecordEventResult = {
  success: boolean;
  error?: string;
};

/**
 * Un événement enrichi du nom de son projet, pour la consultation interne.
 */
export type ProjectEventWithProject = ProjectEvent & {
  project_name: string;
};
