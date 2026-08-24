'use server'

/**
 * Server Action M3 : Mettre à jour le statut d'une Preuve Publique.
 *
 * Règle métier : Utilise proof-rules.ts pour valider la transition.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canTransitionProofStatus } from '../domain/proof-rules'
import type { ProofStatus } from '../types'

export async function updateProofStatus(
  proofId: string,
  newStatus: ProofStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Vérification session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 2. Récupérer la preuve actuelle (avec published_at)
  const { data: proof, error: fetchError } = await supabase
    .from('public_proofs')
    .select('status, slug, deliverable_id, published_at')
    .eq('id', proofId)
    .single()

  if (fetchError || !proof) {
    return { success: false, error: 'Preuve introuvable.' }
  }

  // 3. Validation de la transition
  if (!canTransitionProofStatus(proof.status as ProofStatus, newStatus)) {
    return { success: false, error: `Transition interdite de ${proof.status} vers ${newStatus}.` }
  }

  // 4. Mise à jour du statut
  const updateData: Record<string, any> = { status: newStatus }
  if (newStatus === 'publié' && !proof.published_at) {
    updateData.published_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('public_proofs')
    .update(updateData)
    .eq('id', proofId)

  if (updateError) {
    console.error('Erreur mise à jour statut preuve :', updateError)
    return { success: false, error: `Erreur SQL : ${updateError.message}` }
  }

  // 5. Invalidation du cache
  revalidatePath(`/p/${proof.slug}`)
  revalidatePath('/p')

  return { success: true }
}
