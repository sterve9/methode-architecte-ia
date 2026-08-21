/**
 * Query M2 : Récupérer tous les livrables des étapes d'un projet.
 *
 * Chaîne :
 * 1. Reçoit le projectId.
 * 2. Récupère d'abord les IDs des étapes du projet.
 * 3. Récupère tous les livrables rattachés à ces étapes.
 *
 * Sécurité :
 * - RLS Supabase garantit l'accès uniquement aux données de l'utilisateur.
 */

import { createClient } from '@/lib/supabase/server'
import { Deliverable } from '../types'

export async function getProjectDeliverables(projectId: string): Promise<Deliverable[]> {
  const supabase = await createClient()

  // 1. Récupérer les step_ids du projet
  const { data: steps, error: stepError } = await supabase
    .from('method_steps')
    .select('id')
    .eq('project_id', projectId)

  if (stepError || !steps || steps.length === 0) {
    return []
  }

  const stepIds = steps.map((s) => s.id)

  // 2. Récupérer les livrables pour ces étapes
  const { data: deliverables, error: delivError } = await supabase
    .from('deliverables')
    .select('*')
    .in('step_id', stepIds)
    .order('created_at', { ascending: true })

  if (delivError) {
    console.error('Erreur lors de la récupération des livrables :', delivError)
    return []
  }

  return (deliverables as Deliverable[]) || []
}
