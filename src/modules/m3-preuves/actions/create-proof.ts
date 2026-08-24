'use server'

/**
 * Server Action M3 : Créer une Preuve Publique à partir d'un Livrable.
 *
 * Règle métier : Le livrable source doit être au statut 'Publié' (M2).
 * project_id est récupéré via method_steps (deliverables n'a pas project_id).
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '../domain/slug-generator'
import { isDeliverableEligibleForProof } from '../domain/proof-rules'
import type { CreateProofInput } from '../types'

export async function createProof(
  input: CreateProofInput
): Promise<{ success: boolean; proofId?: string; slug?: string; error?: string }> {
  const supabase = await createClient()

  // 1. Vérification session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 2. Récupérer le livrable source
  const { data: deliverable, error: delivError } = await supabase
    .from('deliverables')
    .select('id, status, title, step_id')
    .eq('id', input.deliverable_id)
    .single()

  if (delivError || !deliverable) {
    return { success: false, error: 'Livrable source introuvable.' }
  }

  // 3. Validation métier : le livrable doit être publié (M2: 'Publié')
  if (!isDeliverableEligibleForProof(deliverable.status)) {
    return {
      success: false,
      error: `Le livrable source doit être au statut Publié (reçu: ${deliverable.status}).`,
    }
  }

  // 4. Remonter project_id via l'étape (pour revalidatePath)
  const { data: step, error: stepError } = await supabase
    .from('method_steps')
    .select('project_id')
    .eq('id', deliverable.step_id)
    .single()

  if (stepError || !step) {
    return { success: false, error: 'Étape rattachée au livrable introuvable.' }
  }

  // 5. Génération du slug (serveur = source de vérité)
  const slug = generateSlug(input.title, input.deliverable_id)

  // 6. Insertion de la preuve
  const { data: newProof, error: insertError } = await supabase
    .from('public_proofs')
    .insert({
      deliverable_id: input.deliverable_id,
      title: input.title.trim(),
      slug,
      format: input.format.trim(),
      summary: input.summary.trim(),
      context: input.context?.trim() || null,
      status: 'brouillon',
    })
    .select('id, slug')
    .single()

  if (insertError) {
    console.error('Erreur création preuve :', insertError)
    return { success: false, error: `Erreur SQL : ${insertError.message}` }
  }

  // 7. Invalidation du cache
  revalidatePath(`/dashboard/projects/${step.project_id}`)
  revalidatePath('/p')
  revalidatePath(`/p/${slug}`)

  return { success: true, proofId: newProof.id, slug: newProof.slug }
}
