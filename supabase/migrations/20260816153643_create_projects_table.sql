-- =============================================================================
-- Migration : create_projects_table
-- Description : Table centrale du système Méthode Architecte IA.
--               L'objet Projet est défini dans docs/metier/03.Objets_Metier.md
--               et son cycle de vie dans docs/metier/05.Cycle_de_Vie.md
-- Lot : Lot 2 - M1 Projets
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum des statuts du cycle de vie du Projet
-- Source : 05.Cycle_de_Vie.md (états E1 à E6)
-- -----------------------------------------------------------------------------
CREATE TYPE public.project_status AS ENUM (
  'Idée',
  'Cadré',
  'En cours',
  'En pause',
  'Livré',
  'Archivé'
);

COMMENT ON TYPE public.project_status IS
  'Statuts du cycle de vie du Projet. Voir docs/metier/05.Cycle_de_Vie.md';

-- -----------------------------------------------------------------------------
-- 2. Fonction utilitaire pour mettre à jour updated_at automatiquement
-- Réutilisable pour toutes les tables futures (M3, M4, etc.)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.set_updated_at() IS
  'Trigger fonction : met à jour updated_at à chaque UPDATE de ligne';

-- -----------------------------------------------------------------------------
-- 3. Table projects
-- Champs métier définis dans docs/metier/03.Objets_Metier.md (fiche 1)
-- -----------------------------------------------------------------------------
CREATE TABLE public.projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  business_problem  text NOT NULL,
  status            public.project_status NOT NULL DEFAULT 'Idée',
  start_date        date NOT NULL DEFAULT CURRENT_DATE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.projects IS
  'Objet central du système. Voir docs/metier/04.Objet_Central.md';

COMMENT ON COLUMN public.projects.name IS
  'Nom du projet (attribut "Nom" dans 03.Objets_Metier.md)';

COMMENT ON COLUMN public.projects.business_problem IS
  'Problème métier traité (attribut "Problème métier traité" dans 03.Objets_Metier.md)';

COMMENT ON COLUMN public.projects.status IS
  'Statut du cycle de vie. Transitions valides définies dans 05.Cycle_de_Vie.md';

COMMENT ON COLUMN public.projects.start_date IS
  'Date de début (attribut "Date de début" dans 03.Objets_Metier.md)';

-- -----------------------------------------------------------------------------
-- 4. Trigger updated_at
-- -----------------------------------------------------------------------------
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Index pour optimiser RLS + listing par utilisateur
-- -----------------------------------------------------------------------------
CREATE INDEX projects_user_id_idx ON public.projects(user_id);

-- -----------------------------------------------------------------------------
-- 6. RLS - Row Level Security
-- Isolation des données par utilisateur (D-01 : utilisateur unique, mais
-- secure by default en prévision)
-- -----------------------------------------------------------------------------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy SELECT : un utilisateur ne voit que ses propres projets
CREATE POLICY projects_select_own
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy INSERT : un utilisateur ne peut créer que ses propres projets
CREATE POLICY projects_insert_own
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy UPDATE : un utilisateur ne peut modifier que ses propres projets
CREATE POLICY projects_update_own
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pas de policy DELETE : la suppression physique est interdite.
-- L'archivage se fait via UPDATE status = 'Archivé' (voir 05.Cycle_de_Vie.md).
