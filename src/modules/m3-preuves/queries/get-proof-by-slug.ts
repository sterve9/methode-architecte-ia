/**
 * Query M3 : Récupérer une preuve publique par son slug.
 *
 * Usage : Page publique /p/[slug].
 * Sécurité : RLS Supabase (public_proofs_select_public) filtre automatiquement.
 */

import { createClient } from '@/lib/supabase/server'
import type { PublicProof } from '../types'

export async function getProofBySlug(slug: string): Promise<PublicProof | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('public_proofs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'publié')
    .single()

  if (error) {
    console.error(`Erreur lors de la récupération de la preuve slug=${slug} :`, error)
    return null
  }

  return (data as PublicProof) || null
}
