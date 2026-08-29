-- Migration : Lecture publique restreinte du livrable source d'une Preuve publiée
-- Contexte : la fiche publique /p/[slug] doit pouvoir afficher un lien vers le
-- livrable source (repo, document...). Un visiteur anonyme ne doit voir QUE le
-- livrable qui sert de source à une Preuve publique au statut 'publié' — jamais
-- l'ensemble des livrables d'un projet (qui restent privés par défaut).

CREATE POLICY "anon can read deliverable source of a published proof"
  ON deliverables
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public_proofs
      WHERE public_proofs.deliverable_id = deliverables.id
        AND public_proofs.status = 'publié'
    )
  );

-- Grant limité aux colonnes nécessaires à l'affichage public (pas de description
-- interne, pas de statut de travail).
GRANT SELECT (id, title, url) ON deliverables TO anon;
