/**
 * Query M3 : Émettre la charge utile du contrat CT-03 (C3 Preuves → C4 Diffusion).
 *
 * Usage : consommée par M4 Diffusion pour générer un brouillon de post.
 * M4 ne requête jamais public_proofs directement (contrainte CA-06).
 *
 * Sécurité : session authentifiée obligatoire. La chaîne
 * public_proofs → deliverables → method_steps → projects n'est traversable
 * qu'avec les policies RLS `authenticated` (l'accès anon s'arrête aux
 * colonnes id/title/url de deliverables, voir DT-Lot4-02).
 */

import { createClient } from '@/lib/supabase/server'
import type { ProofDiffusionPayload } from '../types'

type ProofDiffusionRow = {
  id: string
  title: string
  slug: string
  format: string
  summary: string
  context: string | null
  deliverables: {
    url: string | null
    method_steps: {
      projects: {
        name: string | null
        business_problem: string | null
      } | null
    } | null
  } | null
}

export async function getProofForDiffusion(
  proofId: string
): Promise<ProofDiffusionPayload | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('public_proofs')
    .select(
      'id, title, slug, format, summary, context, deliverables(url, method_steps(projects(name, business_problem)))'
    )
    .eq('id', proofId)
    .eq('status', 'publié')
    .single()

  if (error || !data) {
    console.error(`Erreur lors de la récupération de la preuve id=${proofId} :`, error)
    return null
  }

  const row = data as unknown as ProofDiffusionRow
  const project = row.deliverables?.method_steps?.projects ?? null

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    format: row.format,
    summary: row.summary,
    context: row.context,
    deliverable_url: row.deliverables?.url ?? null,
    project_name: project?.name ?? null,
    project_business_problem: project?.business_problem ?? null,
  }
}
