export type ProofStatus = 'brouillon' | 'publié' | 'archivé';

export interface PublicProof {
  id: string;
  deliverable_id: string;
  title: string;
  slug: string;
  format: string;
  summary: string;
  context: string | null;
  image_url: string | null;
  status: ProofStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProofInput {
  deliverable_id: string;
  title: string;
  slug?: string;
  format: string;
  summary: string;
  context?: string;
  image_url?: string;
}

/**
 * Preuve publique enrichie du titre et de l'URL du livrable source.
 * Usage : fiche publique /p/[slug] (lien "Voir le code source").
 */
export interface PublicProofWithSource extends PublicProof {
  deliverable_title: string | null;
  deliverable_url: string | null;
}

/**
 * Charge utile du contrat CT-03 (C3 Preuves → C4 Diffusion).
 *
 * Émise par M3, consommée par M4 Diffusion : M4 ne lit jamais directement
 * la table public_proofs (contrainte CA-06 de 08.Architecture.md).
 *
 * `project_name` et `project_business_problem` ne sont récupérables qu'en
 * session authentifiée : les policies RLS anon ne donnent accès qu'aux
 * colonnes id/title/url de deliverables (voir DT-Lot4-02).
 */
export interface ProofDiffusionPayload {
  id: string;
  title: string;
  slug: string;
  format: string;
  summary: string;
  context: string | null;
  deliverable_url: string | null;
  project_name: string | null;
  project_business_problem: string | null;
}

export interface UpdateProofInput {
  title?: string;
  slug?: string;
  format?: string;
  summary?: string;
  context?: string;
  image_url?: string;
  status?: ProofStatus;
}
