/**
 * Query M3 : Récupérer toutes les preuves publiques.
 *
 * Usage : Page publique /p (Portfolio).
 *
 * Sécurité : la policy RLS Supabase « Allow public read access to published
 * proofs » (migration 20260824091514) filtre automatiquement sur
 * `status = 'publié'`. C'est une policy de LIGNE : elle couvre toutes les
 * colonnes, y compris les champs d'étude de cas ajoutés par DT-S25-02.
 * Le `.eq('status', 'publié')` ci-dessous est redondant avec la policy et
 * conservé volontairement : la requête reste juste même en session
 * authentifiée, où la policy `authenticated` donne accès à tout.
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
