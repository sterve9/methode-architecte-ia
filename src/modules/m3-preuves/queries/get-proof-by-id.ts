/**
 * Query M3 : Récupérer une preuve par son id, quel que soit son statut.
 *
 * Usage : écran d'édition privé /dashboard/proofs/[id].
 *
 * Pourquoi cette query existe (DT-S25-02) : `getProofBySlug` filtre sur
 * `status = 'publié'` — c'est sa raison d'être, elle sert la vitrine. Un
 * BROUILLON y est donc invisible, et sans lecture tous statuts il serait
 * impossible d'éditer une preuve avant de la publier.
 *
 * Sécurité : aucune policy `anon` ne couvre les brouillons. La lecture n'est
 * possible qu'en session `authenticated`, via la policy « Allow authenticated
 * full access to public_proofs » (20260824091514). L'absence de filtre sur
 * le statut ici n'ouvre donc rien au public.
 */

import { createClient } from '@/lib/supabase/server'
import type { PublicProof } from '../types'

export async function getProofById(id: string): Promise<PublicProof | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('public_proofs')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`Erreur lors de la récupération de la preuve id=${id} :`, error)
    return null
  }

  return (data as PublicProof) ?? null
}
