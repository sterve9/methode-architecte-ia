-- Migration : Création de la table public_proofs (M3 Preuves publiques)
-- Documents de référence : docs/technique/decisions.md (DT-Lot4-01, DT-Lot4-02)

CREATE TABLE IF NOT EXISTS public_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  format VARCHAR(100) NOT NULL,
  summary TEXT NOT NULL,
  context TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'publié', 'archivé')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes par slug, livrable source et statut
CREATE INDEX IF NOT EXISTS idx_public_proofs_slug ON public_proofs(slug);
CREATE INDEX IF NOT EXISTS idx_public_proofs_deliverable_id ON public_proofs(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_public_proofs_status ON public_proofs(status);

-- Activation Row Level Security
ALTER TABLE public_proofs ENABLE ROW LEVEL SECURITY;

-- Politique 1 : Lecture publique pour les preuves 'publié' (visiteurs anonymes et connectés)
CREATE POLICY "Allow public read access to published proofs"
  ON public_proofs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'publié');

-- Politique 2 : Accès complet pour les utilisateurs authentifiés (dashboard privé)
CREATE POLICY "Allow authenticated full access to public_proofs"
  ON public_proofs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permissions
GRANT SELECT ON public_proofs TO anon;
GRANT ALL ON public_proofs TO authenticated;
