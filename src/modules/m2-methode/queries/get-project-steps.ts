/**
 * Query M2 : Récupérer les étapes rattachées à un projet.
 *
 * Chaîne :
 * 1. Reçoit le projectId.
 * 2. Effectue une requête SELECT sur method_steps filtrée par project_id.
 * 3. Ordonne les étapes selon step_order (1 à 13).
 *
 * Sécurité :
 * - RLS Supabase s'applique : l'utilisateur ne verra que les étapes des projets lui appartenant.
 */

import { createClient } from '@/lib/supabase/server'
import { MethodStep } from '../types'

export async function getProjectSteps(projectId: string): Promise<MethodStep[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('method_steps')
    .select('*')
    .eq('project_id', projectId)
    .order('step_order', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des étapes :', error)
    return []
  }

  return (data as MethodStep[]) || []
}
