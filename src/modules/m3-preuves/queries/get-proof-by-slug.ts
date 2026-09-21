/**
 * Query M3 : Récupérer une preuve publique par son slug.
 *
 * Usage : Page publique /p/[slug].
 *
 * Sécurité : la policy RLS Supabase « Allow public read access to published
 * proofs » (migration 20260824091514) filtre automatiquement sur
 * `status = 'publié'`. C'est une policy de LIGNE : elle couvre toutes les
 * colonnes, y compris les champs d'étude de cas ajoutés par DT-S25-02.
 */

import { createClient } from '@/lib/supabase/server'
import type { PublicProof, PublicProofWithSource } from '../types'

export async function getProofBySlug(slug: string): Promise<PublicProofWithSource | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('public_proofs')
    .select('*, deliverables(title, url)')
    .eq('slug', slug)
    .eq('status', 'publié')
    .single()

  if (error || !data) {
    console.error(`Erreur lors de la récupération de la preuve slug=${slug} :`, error)
    return null
  }

  const { deliverables, ...proof } = data as PublicProof & {
    deliverables: { title: string; url: string } | null
  }

  return {
    ...proof,
    deliverable_title: deliverables?.title ?? null,
    deliverable_url: deliverables?.url ?? null,
  }
}
