'use server'

/**
 * Server Action M3 : Créer une Preuve Publique à partir d'un Livrable.
 *
 * Règle métier : Le livrable source doit être au statut 'publié'.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateSlug } from '../domain/slug-generator'
import { isDeliverableEligibleForProof } from '../domain/proof-rules'
import type { CreateProofInput } from '../types'

export async function createProof(
  input: CreateProofInput
): Promise<{ success: boolean; proofId?: string; error?: string }> {
  const supabase = await createClient()

  // 1. Vérification session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 2. Récupérer le livrable source pour vérifier son statut
  const { data: deliverable, error: delivError } = await supabase
    .from('deliverables')
    .select('id, status, project_id')
    .eq('id', input.deliverable_id)
    .single()

  if (delivError || !deliverable) {
    return { success: false, error: 'Livrable source introuvable.' }
  }

  // 3. Validation métier : le livrable doit être publié
  if (!isDeliverableEligibleForProof(deliverable.status)) {
    return { success: false, error: 'Le livrable source doit être au statut publié.' }
  }

  // 4. Génération du slug
  const slug = generateSlug(input.title, input.deliverable_id)

  // 5. Insertion de la preuve
  const { data: newProof, error: insertError } = await supabase
    .from('public_proofs')
    .insert({
      deliverable_id: input.deliverable_id,
      title: input.title,
      slug,
      format: input.format,
      summary: input.summary,
      context: input.context || null,
      status: 'brouillon',
    })
    .select()
    .single()

  if (insertError) {
    console.error('Erreur création preuve :', insertError)
    return { success: false, error: `Erreur SQL : ${insertError.message}` }
  }

  // 6. Invalidation du cache (page projet + page preuve si déjà publiée)
  revalidatePath(`/dashboard/projects/${deliverable.project_id}`)
  revalidatePath(`/p/${slug}`)

  return { success: true, proofId: newProof.id }
}
