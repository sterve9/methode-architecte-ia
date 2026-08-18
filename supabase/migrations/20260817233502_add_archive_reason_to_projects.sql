-- =============================================================================
-- Migration : ajout du champ archive_reason à la table projects
-- =============================================================================
-- Contexte : voir docs/technique/decisions.md → DT-Lot2-01
-- Règle métier : voir docs/methode/05.Cycle_de_Vie.md section 4bis
--
-- Le champ archive_reason est nullable en base (aucune contrainte CHECK).
-- La règle "obligatoire si status = 'Archivé'" est validée uniquement
-- au niveau applicatif dans la Server Action archiveProject().
--
-- Cette décision est cohérente avec la dette assumée depuis S13 :
-- validation applicative uniquement, pas de trigger DB, en attendant
-- une éventuelle ouverture multi-user (voir DT-Lot1-01).
-- =============================================================================

ALTER TABLE public.projects
  ADD COLUMN archive_reason TEXT NULL;

COMMENT ON COLUMN public.projects.archive_reason IS
  'Raison de l''archivage du projet. Obligatoire au niveau applicatif '
  'lorsque status = ''Archivé'' (transitions T6, T7, T8). '
  'Voir docs/methode/05.Cycle_de_Vie.md section 4bis.';
