'use server'

/**
 * Server Action : Changer le statut d'une étape de méthode.
 *
 * Chaîne :
 * 1. Vérifie l'authentification de l'utilisateur.
 * 2. Récupère l'étape existante en base.
 * 3. Valide la transition avec assertCanStepTransition(currentStatus, newStatus).
 * 4. Met à jour le statut dans method_steps.
 * 5. Émet l'événement « Étape terminée » vers M5 si l'étape vient d'être
 *    terminée (contrat CT-10).
 * 6. Invalide le cache de la page projet /dashboard/projects/[id].
 *
 * Sécurité :
 * - RLS Supabase (method_steps_update_own) garantit l'appartenance du projet.
 * - Validation métier dans le domain layer (défense en profondeur).
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { recordEvent } from '@/modules/m5-mesures/actions/record-event'
import { assertCanStepTransition } from '../domain/step-transitions'
import { MethodStepStatus } from '../types'

export async function updateStepStatus(
  stepId: string,
  newStatus: MethodStepStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Vérification session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 2. Récupération de l'étape existante
  const { data: step, error: fetchError } = await supabase
    .from('method_steps')
    .select('id, status, project_id')
    .eq('id', stepId)
    .single()

  if (fetchError || !step) {
    return { success: false, error: 'Étape introuvable' }
  }

  const currentStatus = step.status as MethodStepStatus

  // 3. Validation de la transition métier
  try {
    assertCanStepTransition(currentStatus, newStatus)
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Transition interdite',
    }
  }

  // 4. Mise à jour en base
  const { error: updateError } = await supabase
    .from('method_steps')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId)

  if (updateError) {
    return { success: false, error: `Erreur SQL : ${updateError.message}` }
  }

  // 5. Contrat CT-10 : seule l'entrée dans l'état 'Terminée' est un événement.
  //    Le passage par assertCanStepTransition garantit déjà que currentStatus
  //    n'était pas 'Terminée' (état terminal), donc aucun doublon possible.
  if (newStatus === 'Terminée') {
    await recordEvent({
      type: 'Étape terminée',
      sourceId: step.id,
      projectId: step.project_id,
    })
  }

  // 6. Invalidation du cache de la page projet
  revalidatePath(`/dashboard/projects/${step.project_id}`)

  return { success: true }
}
