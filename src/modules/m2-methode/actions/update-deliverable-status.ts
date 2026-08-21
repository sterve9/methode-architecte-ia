'use server'

/**
 * Server Action : Changer le statut d'un livrable (Brouillon <-> Publié).
 *
 * Chaîne :
 * 1. Vérifie l'authentification.
 * 2. Récupère le livrable actuel en base.
 * 3. Valide la transition avec assertCanDeliverableTransition.
 * 4. Met à jour le statut dans deliverables.
 * 5. Invalide le cache de la page projet.
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { assertCanDeliverableTransition } from '../domain/deliverable-transitions'
import { DeliverableStatus } from '../types'

export async function updateDeliverableStatus(
  deliverableId: string,
  newStatus: DeliverableStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 2. Charger le livrable existant avec son étape rattachée
  const { data: deliv, error: fetchError } = await supabase
    .from('deliverables')
    .select('id, status, step_id, method_steps(project_id)')
    .eq('id', deliverableId)
    .single()

  if (fetchError || !deliv) {
    return { success: false, error: 'Livrable introuvable' }
  }

  const currentStatus = deliv.status as DeliverableStatus

  // 3. Validation de transition
  try {
    assertCanDeliverableTransition(currentStatus, newStatus)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Transition interdite',
    }
  }

  // 4. Update SQL
  const { error: updateError } = await supabase
    .from('deliverables')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deliverableId)

  if (updateError) {
    return { success: false, error: `Erreur SQL : ${updateError.message}` }
  }

  // 5. Invalidation
  // method_steps peut être retourné comme un objet ou tableau par Supabase
  const rawStep = deliv.method_steps as unknown as { project_id: string } | { project_id: string }[] | null
  const projectId = Array.isArray(rawStep) ? rawStep[0]?.project_id : rawStep?.project_id

  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`)
  }

  return { success: true }
}
