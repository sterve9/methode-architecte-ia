-- =============================================================================
-- Migration : création des tables méthode versionnée + étapes projet + livrables
-- Séance : S16
-- Lot : 3 - M2 Méthode
-- Décisions référencées : DT-Lot3-01, DT-Lot3-02
-- Documentation : docs/methode/03.Objets_Metier.md (fiches 2, 3, 9)
--                 docs/methode/05.Cycle_de_Vie.md (sections 7, 8)
-- =============================================================================


-- =============================================================================
-- 1. TABLE method_versions
-- =============================================================================
-- Canevas versionné de la méthode d'architecte IA.
-- Une seule version est active à la fois. Les nouveaux projets clonent leurs
-- étapes depuis la version active au moment de leur création.
-- Une version est immuable : pour évoluer, on crée une nouvelle version.

CREATE TABLE method_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contrainte : au maximum une seule version active à la fois
-- (index partiel unique sur is_active = true)
CREATE UNIQUE INDEX idx_method_versions_only_one_active
  ON method_versions (is_active)
  WHERE is_active = true;


-- =============================================================================
-- 2. TABLE method_version_steps
-- =============================================================================
-- Étapes du canevas d'une version de méthode.
-- L'ordre est significatif : les étapes sont numérotées de 1 à N.

CREATE TABLE method_version_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES method_versions(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  UNIQUE (version_id, step_order)
);


-- =============================================================================
-- 3. TABLE method_steps
-- =============================================================================
-- Instances d'étapes rattachées à un projet.
-- Créées automatiquement à la création du projet en clonant le canevas.
-- Cycle de vie : À faire → En cours → Terminée (voir 05.Cycle_de_Vie section 7).

CREATE TABLE method_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_step_id UUID NULL REFERENCES method_version_steps(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'À faire',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT method_steps_status_check
    CHECK (status IN ('À faire', 'En cours', 'Terminée'))
);

CREATE INDEX idx_method_steps_project_id ON method_steps(project_id);


-- =============================================================================
-- 4. TABLE deliverables
-- =============================================================================
-- Livrables rattachés à une étape de projet.
-- Format : URL uniquement au Lot 3 (voir DT-Lot3-01).
-- Cycle de vie : Brouillon → Publié (voir 05.Cycle_de_Vie section 8).

CREATE TABLE deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES method_steps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Brouillon',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deliverables_status_check
    CHECK (status IN ('Brouillon', 'Publié')),
  CONSTRAINT deliverables_url_not_empty
    CHECK (length(trim(url)) > 0)
);

CREATE INDEX idx_deliverables_step_id ON deliverables(step_id);


-- =============================================================================
-- 5. ALTER projects : ajout de version_id
-- =============================================================================
-- Ajout de la référence à la version de méthode appliquée au projet.
-- Étape 1 : ajouter la colonne en NULL (backfill possible ensuite)
-- Étape 2 (après seed) : passer en NOT NULL + FK RESTRICT

ALTER TABLE projects
  ADD COLUMN version_id UUID NULL;


-- =============================================================================
-- 6. SEED : Version 1.0 de la méthode
-- =============================================================================
-- Insère la version 1.0 (active par défaut) et ses 13 étapes correspondant
-- aux fichiers 01.Besoin_Client.md à 13.Documentation.md.

DO $$
DECLARE
  v_version_id UUID;
BEGIN
  -- Insertion de la version 1.0
  INSERT INTO method_versions (name, description, is_active)
  VALUES (
    'v1.0',
    'Version initiale de la méthode d''architecte IA — 13 étapes couvrant l''intégralité du cycle projet, du besoin client à la documentation finale.',
    true
  )
  RETURNING id INTO v_version_id;

  -- Insertion des 13 étapes du canevas
  INSERT INTO method_version_steps (version_id, step_order, title, description) VALUES
    (v_version_id, 1,  'Besoin Client',        'Formaliser le besoin brut exprimé par le client tel qu''il a été énoncé, sans reformulation prématurée.'),
    (v_version_id, 2,  'Problème Métier',      'Transformer le besoin brut en problème métier mesurable et actionnable.'),
    (v_version_id, 3,  'Objets Métier',        'Identifier les entités indispensables au fonctionnement du métier.'),
    (v_version_id, 4,  'Objet Central',        'Déterminer l''objet dont l''absence détruirait le métier.'),
    (v_version_id, 5,  'Cycle de Vie',         'Modéliser les états et transitions de l''objet central.'),
    (v_version_id, 6,  'Composants',           'Décomposer le système en composants métier cohérents.'),
    (v_version_id, 7,  'Contrats',             'Définir les contrats de données échangées entre les composants.'),
    (v_version_id, 8,  'Architecture',         'Concevoir l''architecture technique à partir des composants et de leurs contrats.'),
    (v_version_id, 9,  'Choix Technos',        'Sélectionner les technologies adaptées à l''architecture définie.'),
    (v_version_id, 10, 'Justifications',       'Formaliser les décisions techniques prises et leurs justifications (ADR).'),
    (v_version_id, 11, 'Plan d''Implémentation','Découper le travail en lots livrables avec critères de sortie observables.'),
    (v_version_id, 12, 'Stratégie de Tests',   'Définir la stratégie de tests adaptée aux enjeux du système.'),
    (v_version_id, 13, 'Documentation',        'Produire la documentation nécessaire à l''usage et à la maintenance du système.');

  -- Backfill : tous les projets existants sont rattachés à v1.0
  UPDATE projects SET version_id = v_version_id WHERE version_id IS NULL;
END $$;


-- =============================================================================
-- 7. Finalisation ALTER projects : version_id NOT NULL + FK
-- =============================================================================

ALTER TABLE projects
  ALTER COLUMN version_id SET NOT NULL,
  ADD CONSTRAINT projects_version_id_fkey
    FOREIGN KEY (version_id) REFERENCES method_versions(id) ON DELETE RESTRICT;


-- =============================================================================
-- 8. RLS : activation sur les 4 nouvelles tables
-- =============================================================================

ALTER TABLE method_versions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE method_version_steps   ENABLE ROW LEVEL SECURITY;
ALTER TABLE method_steps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables           ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 9. POLICIES RLS
-- =============================================================================

-- method_versions : lecture ouverte aux authentifiés (données de référence).
-- Écriture réservée à l'admin Supabase Studio (aucune policy INSERT/UPDATE/DELETE).
CREATE POLICY "authenticated can read method_versions"
  ON method_versions
  FOR SELECT
  TO authenticated
  USING (true);

-- method_version_steps : idem method_versions (référence, lecture seule côté app).
CREATE POLICY "authenticated can read method_version_steps"
  ON method_version_steps
  FOR SELECT
  TO authenticated
  USING (true);

-- method_steps : lecture/écriture uniquement sur les étapes des projets
-- dont l'utilisateur est propriétaire (via join sur projects.user_id).
CREATE POLICY "user can read own project steps"
  ON method_steps
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = method_steps.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "user can insert own project steps"
  ON method_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = method_steps.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "user can update own project steps"
  ON method_steps
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = method_steps.project_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "user can delete own project steps"
  ON method_steps
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = method_steps.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- deliverables : lecture/écriture uniquement sur les livrables des étapes
-- appartenant aux projets de l'utilisateur (double join step → project).
CREATE POLICY "user can read own project deliverables"
  ON deliverables
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM method_steps
      JOIN projects ON projects.id = method_steps.project_id
      WHERE method_steps.id = deliverables.step_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "user can insert own project deliverables"
  ON deliverables
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM method_steps
      JOIN projects ON projects.id = method_steps.project_id
      WHERE method_steps.id = deliverables.step_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "user can update own project deliverables"
  ON deliverables
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM method_steps
      JOIN projects ON projects.id = method_steps.project_id
      WHERE method_steps.id = deliverables.step_id
        AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "user can delete own project deliverables"
  ON deliverables
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM method_steps
      JOIN projects ON projects.id = method_steps.project_id
      WHERE method_steps.id = deliverables.step_id
        AND projects.user_id = auth.uid()
    )
  );


-- =============================================================================
-- 10. GRANTs (leçon S14 : ne pas oublier les GRANTs authenticated)
-- =============================================================================

GRANT SELECT                         ON method_versions        TO authenticated;
GRANT SELECT                         ON method_version_steps   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON method_steps           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deliverables           TO authenticated;
