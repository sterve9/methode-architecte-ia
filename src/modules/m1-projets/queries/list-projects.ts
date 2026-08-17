/**
 * Query : lister tous les projets de l'utilisateur connecté.
 *
 * - Server-only (utilise createClient() serveur).
 * - RLS-safe : la policy projects_select_own filtre automatiquement
 *   sur user_id = auth.uid(). Aucun .eq('user_id', ...) à ajouter.
 * - Tri : plus récents en premier (created_at DESC).
 *
 * En cas d'erreur DB : throw. L'appelant (Server Component) peut
 * la capturer via error.tsx ou la laisser remonter.
 */

import { createClient } from '@/lib/supabase/server'

import type { Project } from '../types'

export async function listProjects(): Promise<Project[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erreur lors du chargement des projets : ${error.message}`)
  }

  return (data ?? []) as Project[]
}
