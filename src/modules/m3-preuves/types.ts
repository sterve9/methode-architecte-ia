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

export interface UpdateProofInput {
  title?: string;
  slug?: string;
  format?: string;
  summary?: string;
  context?: string;
  image_url?: string;
  status?: ProofStatus;
}
