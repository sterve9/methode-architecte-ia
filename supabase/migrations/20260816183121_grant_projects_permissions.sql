-- =============================================================================
-- Migration : grant_projects_permissions
-- Description : Ajoute les GRANTs manquants pour le rôle authenticated
--               sur la table projects et l'enum project_status.
--               Sans ces GRANTs, PostgreSQL refuse tout accès à la table
--               AVANT même d'évaluer les policies RLS
--               (erreur "permission denied for table projects").
-- Lot : Lot 2 - M1 Projets (correction migration 20260816153643)
-- =============================================================================

-- Autorise l'utilisation de l'enum par les users connectés
GRANT USAGE ON TYPE public.project_status TO authenticated;

-- Autorise SELECT / INSERT / UPDATE sur la table projects.
-- RLS filtre ensuite les lignes visibles/modifiables (user_id = auth.uid()).
-- Pas de GRANT DELETE : la suppression physique reste interdite
-- (voir 05.Cycle_de_Vie.md et migration create_projects_table).
GRANT SELECT, INSERT, UPDATE ON TABLE public.projects TO authenticated;

-- Le rôle anon (non-connecté) ne reçoit AUCUN privilège : secure by default.
