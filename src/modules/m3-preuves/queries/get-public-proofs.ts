/**
 * Query M3 : Récupérer toutes les preuves publiques.
 *
 * Usage : Page publique /p (Portfolio).
 * Sécurité : RLS Supabase (public_proofs_select_public) filtre automatiquement.
 */

import { createClient } from '@/lib/supabase/server'
import type { PublicProof } from '../types'

export async function getPublicProofs(): Promise<PublicProof[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('public_proofs')
    .select('*')
    .eq('status', 'publié')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des preuves publiques :', error)
    return []
  }

  return (data as PublicProof[]) || []
}
