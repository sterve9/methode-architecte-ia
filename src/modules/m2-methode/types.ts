/**
 * Types du module M2 - Méthode
 *
 * Sources métier :
 * - docs/methode/03.Objets_Metier.md (fiches 2, 3, 9)
 * - docs/methode/05.Cycle_de_Vie.md (sections 7, 8)
 * Sources techniques :
 * - docs/technique/decisions.md (DT-Lot3-01, DT-Lot3-02)
 * - supabase/migrations/20260819120000_create_method_and_deliverables_tables.sql
 */

// ============================================================================
// Enums métier (états des cycles de vie)
// ============================================================================

/**
 * États possibles d'une Étape méthode (voir 05.Cycle_de_Vie.md section 7).
 */
export type MethodStepStatus = 'À faire' | 'En cours' | 'Terminée';

/**
 * États possibles d'un Livrable (voir 05.Cycle_de_Vie.md section 8).
 */
export type DeliverableStatus = 'Brouillon' | 'Publié';

// ============================================================================
// Objets métier
// ============================================================================

/**
 * Version de méthode (fiche 9).
 * Canevas versionné et immuable. Une seule version est active à la fois.
 */
export type MethodVersion = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

/**
 * Étape du canevas d'une version de méthode.
 * Sert de template lors du clonage à la création d'un projet.
 */
export type MethodVersionStep = {
  id: string;
  version_id: string;
  step_order: number;
  title: string;
  description: string | null;
};

/**
 * Instance d'étape rattachée à un projet (fiche 2).
 * Créée par clonage du canevas à la création du projet.
 */
export type MethodStep = {
  id: string;
  project_id: string;
  template_step_id: string | null;
  step_order: number;
  title: string;
  description: string | null;
  status: MethodStepStatus;
  created_at: string;
  updated_at: string;
};

/**
 * Livrable rattaché à une étape (fiche 3).
 * Au Lot 3 : URL uniquement (voir DT-Lot3-01).
 */
export type Deliverable = {
  id: string;
  step_id: string;
  title: string;
  description: string | null;
  url: string;
  status: DeliverableStatus;
  created_at: string;
  updated_at: string;
};
