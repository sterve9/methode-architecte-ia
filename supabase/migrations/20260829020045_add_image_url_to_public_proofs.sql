-- Migration : Ajout d'une image de preuve visuelle sur public_proofs
-- Contexte : ADR DT-Lot4-04 (crash test contenu réel + polissage UX).
-- Même philosophie que Deliverable.url (DT-Lot3-01) : le système stocke une
-- référence externe stable (ex: capture hébergée sur le repo GitHub source),
-- jamais le fichier lui-même.

ALTER TABLE public_proofs
  ADD COLUMN image_url TEXT NULL;
