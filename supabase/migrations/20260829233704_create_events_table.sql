-- =============================================================================
-- Migration : création de la table events (M5 Instrumentation)
-- Séance : S23
-- Lot : 5 - Instrumentation
-- Décisions référencées : DT-Lot5-01 (base contractuelle), DT-Lot5-09 (ce modèle)
-- Documentation : docs/methode/07.Contrats.md (CT-04, CT-10, CT-11)
--                 docs/methode/11.Plan_Implementation.md (Lot 5)
-- =============================================================================


-- =============================================================================
-- 1. TABLE events
-- =============================================================================
-- Journal des 4 événements clés de la chaîne de valeur.
-- Écrit exclusivement par le module m5-mesures (recordEvent), appelé depuis
-- les Server Actions des modules émetteurs — jamais par un trigger PostgreSQL
-- (choix tranché en S22 : respect de CA-06 et testabilité Vitest).
--
-- Référence polymorphe assumée : les 4 événements pointent vers 4 tables
-- différentes (projects, method_steps, deliverables, public_proofs). Une clé
-- étrangère ne pouvant viser qu'une seule table, `source_id` est un UUID nu,
-- qualifié par `source_type`. L'intégrité repose sur le CHECK ci-dessous et
-- sur le fait que toute écriture passe par recordEvent().
--
-- `project_id` est en revanche une vraie FK : il porte la métrique de cadence
-- (CT-04, CT-10, CT-11) et sert de pivot à la RLS. Le CASCADE n'a pas vocation
-- à servir — aucune suppression physique de projet n'est prévue (DT-Lot2-01) —
-- il garantit seulement qu'aucun événement orphelin ne peut subsister.
--
-- Écart connu et assumé avec CT-04 : le contrat prévoit « état de départ » et
-- « état d'arrivée » pour toute transition de projet. Le périmètre du Lot 5 ne
-- retient que « Projet créé », c'est-à-dire la transition initiale (∅ → Idée),
-- déductible du type seul. Les deux colonnes seront ajoutées en migration
-- additive le jour où les autres transitions seront instrumentées.

CREATE TABLE events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,
  source_type TEXT        NOT NULL,
  source_id   UUID        NOT NULL,
  project_id  UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_type_check
    CHECK (type IN ('Projet créé', 'Étape terminée', 'Livrable attaché', 'Preuve publiée')),

  CONSTRAINT events_source_type_check
    CHECK (source_type IN ('project', 'method_step', 'deliverable', 'public_proof'))
);


-- =============================================================================
-- 2. INDEX
-- =============================================================================
-- La consultation interne lit le journal par projet et par ordre antéchronologique.

CREATE INDEX idx_events_project_id  ON events(project_id);
CREATE INDEX idx_events_occurred_at ON events(occurred_at DESC);
CREATE INDEX idx_events_type        ON events(type);


-- =============================================================================
-- 3. RLS
-- =============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement les événements des projets dont l'utilisateur est
-- propriétaire. Même pivot que method_steps (join sur projects.user_id).
CREATE POLICY "user can read own project events"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = events.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Écriture : uniquement sur ses propres projets.
CREATE POLICY "user can insert own project events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = events.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- AUCUNE policy UPDATE, AUCUNE policy DELETE, volontairement : le journal est
-- append-only. Un journal d'événements que l'application peut réécrire ne vaut
-- rien comme mesure. Conséquence assumée : les événements produits par le test
-- E2E en production restent en base ; la consultation interne les écarte à la
-- lecture (projets nommés « [E2E] … »), elle ne les supprime pas.
--
-- AUCUNE policy pour le rôle `anon`, volontairement : critère de sortie du
-- Lot 5, « aucun événement privé n'est exposé publiquement ».


-- =============================================================================
-- 4. GRANTs (leçon S14 : ne pas oublier les GRANTs authenticated)
-- =============================================================================

GRANT SELECT, INSERT ON events TO authenticated;

-- Défense en profondeur : la RLS suffit déjà à bloquer `anon` (aucune policy
-- ne le concerne), mais on retire aussi tout privilège de table pour que la
-- moindre erreur future de policy ne puisse pas ouvrir le journal au public.
REVOKE ALL ON events FROM anon;
