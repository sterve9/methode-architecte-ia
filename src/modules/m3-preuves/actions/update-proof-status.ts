'use server'

/**
 * Server Action M3 : Mettre à jour le statut d'une Preuve Publique.
 *
 * Règle métier : Utilise proof-rules.ts pour valider la transition.
 * Contrat CT-11 : la première publication est signalée à M5 Instrumentation.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { recordEvent } from '@/modules/m5-mesures/actions/record-event'
import { canTransitionProofStatus } from '../domain/proof-rules'
import type { ProofStatus } from '../types'

/**
 * Forme de la ligne lue, jointures comprises.
 * La chaîne public_proofs → deliverables → method_steps porte le project_id
 * exigé par CT-11 : la table public_proofs ne le connaît pas directement.
 */
type ProofStatusRow = {
  status: string
  slug: string
  deliverable_id: string
  published_at: string | null
  deliverables: {
    method_steps: {
      project_id: string
    } | null
  } | null
}

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

  // 2. Récupérer la preuve actuelle (avec published_at et le projet porteur)
  const { data, error: fetchError } = await supabase
    .from('public_proofs')
    .select('status, slug, deliverable_id, published_at, deliverables(method_steps(project_id))')
    .eq('id', proofId)
    .single()

  if (fetchError || !data) {
    return { success: false, error: 'Preuve introuvable.' }
  }

  const proof = data as unknown as ProofStatusRow

  // 3. Validation de la transition
  if (!canTransitionProofStatus(proof.status as ProofStatus, newStatus)) {
    return { success: false, error: `Transition interdite de ${proof.status} vers ${newStatus}.` }
  }

  // 4. Mise à jour du statut
  //    canTransitionProofStatus autorise publié → publié (idempotence) : c'est
  //    published_at, et non le statut cible, qui distingue une VRAIE première
  //    publication d'un simple renvoi. Le même booléen sert donc à horodater
  //    et à décider de l'émission de l'événement — impossible de compter deux
  //    fois la même preuve dans la cadence.
  const isFirstPublication = newStatus === 'publié' && !proof.published_at

  const updateData: { status: ProofStatus; published_at?: string } = { status: newStatus }
  if (isFirstPublication) {
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

  // 5. Contrat CT-11 : signaler la publication de la preuve à M5.
  const projectId = proof.deliverables?.method_steps?.project_id ?? null

  if (isFirstPublication && projectId) {
    await recordEvent({
      type: 'Preuve publiée',
      sourceId: proofId,
      projectId,
    })
  }

  // 6. Invalidation du cache
  revalidatePath(`/p/${proof.slug}`)
  revalidatePath('/p')
  revalidatePath('/dashboard/diffusion')

  return { success: true }
}
