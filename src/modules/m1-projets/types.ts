/**
 * Types TypeScript pour le module M1 Projets.
 *
 * Reflet exact du schema SQL défini dans :
 * supabase/migrations/20260816153643_create_projects_table.sql
 *
 * Objet métier documenté dans :
 * - docs/methode/03.Objets_Metier.md (fiche 1)
 * - docs/methode/04.Objet_Central.md
 * - docs/methode/05.Cycle_de_Vie.md
 */

/**
 * Statuts du cycle de vie du Projet.
 * Source : docs/methode/05.Cycle_de_Vie.md (états E1 à E6).
 * Doit rester strictement synchronisé avec l'enum SQL project_status.
 */
export type ProjectStatus =
  | 'Idée'
  | 'Cadré'
  | 'En cours'
  | 'En pause'
  | 'Livré'
  | 'Archivé'

/**
 * Représentation TypeScript d'une ligne de la table projects.
 * Les champs date/timestamp sont retournés en string ISO par Supabase JS.
 */
export type Project = {
  id: string
  user_id: string
  name: string
  business_problem: string
  status: ProjectStatus
  start_date: string
  archive_reason: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload utilisé pour créer un projet.
 * id, user_id, status, start_date et timestamps sont gérés
 * côté serveur ou par les DEFAULT SQL.
 */
export type CreateProjectInput = {
  name: string
  business_problem: string
}
