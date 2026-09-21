-- Migration : la Preuve publique devient une ÉTUDE DE CAS orientée client
-- Contexte : ADR DT-S25-02. La couche publique (/p, /p/[slug]) ne doit plus
-- exposer l'objet « méthode » (format, contexte de production) mais le CAS :
-- pour qui, quel problème, quoi construit, quel résultat, quelle démonstration.
--
-- Périmètre de CETTE migration : le modèle de données uniquement. Les pages
-- publiques sont traitées dans une étape suivante et séparée.
--
-- Nullabilité : les 5 colonnes sont NULLables. Les preuves déjà publiées en
-- production n'ont aucune de ces valeurs ; un NOT NULL ferait échouer la
-- migration. L'exigence « une étude de cas complète » est portée par la
-- validation applicative (M3), pas par une contrainte de table — cohérent
-- avec image_url (20260829020045).

ALTER TABLE public_proofs
  ADD COLUMN metier    TEXT NULL,
  ADD COLUMN probleme  TEXT NULL,
  ADD COLUMN solution  TEXT NULL,
  ADD COLUMN resultat  TEXT NULL,
  ADD COLUMN video_url TEXT NULL;

COMMENT ON COLUMN public_proofs.metier IS
  'Cible / métier du cas, en langage client (ex. « Gestion de réseaux sociaux »).';
COMMENT ON COLUMN public_proofs.probleme IS
  'Le problème du client, formulé dans ses mots — jamais en vocabulaire méthode.';
COMMENT ON COLUMN public_proofs.solution IS
  'Ce qui a été construit, en clair. N''énumère PAS les étapes de la méthode.';
COMMENT ON COLUMN public_proofs.resultat IS
  'Le résultat / la transformation obtenue, chiffrée quand la donnée existe.';
COMMENT ON COLUMN public_proofs.video_url IS
  'URL YouTube de la démonstration. Référence externe stable, jamais le fichier (cf. DT-Lot3-01).';

-- Colonnes dépréciées : conservées (aucune donnée détruite), mais retirées de
-- l'exposition publique à l'étape suivante. Voir DT-S25-02.
COMMENT ON COLUMN public_proofs.format IS
  'DÉPRÉCIÉ (DT-S25-02) : vocabulaire méthode. Conservé, plus exposé en public.';
COMMENT ON COLUMN public_proofs.context IS
  'DÉPRÉCIÉ (DT-S25-02) : vocabulaire méthode. Conservé, plus exposé en public.';

-- Exposition anon : RIEN à ajouter, et c'est vérifié, pas supposé.
-- 1. La policy de lecture publique (« Allow public read access to published
--    proofs », 20260824091514) est une policy de LIGNE (USING status = 'publié')
--    sans clause de colonnes : Postgres n'a pas de RLS par colonne. Elle couvre
--    donc les 5 nouvelles colonnes sans modification.
-- 2. Le GRANT de 20260824091514 est `GRANT SELECT ON public_proofs TO anon`,
--    au niveau TABLE (sans liste de colonnes) : il porte sur toutes les colonnes,
--    présentes et futures. À ne pas confondre avec `deliverables`, qui porte un
--    grant par colonnes `(id, title, url)` (20260829013159) — celui-là, lui,
--    exigerait un GRANT explicite à chaque nouvelle colonne.
-- Précédent confirmé : image_url a été ajoutée sans grant et est bien lue en
-- production par un visiteur anonyme.
