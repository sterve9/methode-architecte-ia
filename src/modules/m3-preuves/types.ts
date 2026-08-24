export type ProofStatus = 'brouillon' | 'publié' | 'archivé';

export interface PublicProof {
  id: string;
  deliverable_id: string;
  title: string;
  slug: string;
  format: string;
  summary: string;
  context: string | null;
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
}

export interface UpdateProofInput {
  title?: string;
  slug?: string;
  format?: string;
  summary?: string;
  context?: string;
  status?: ProofStatus;
}
