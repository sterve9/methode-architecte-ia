/**
 * Query M5 : lire le journal des événements pour la consultation interne.
 *
 * Sécurité : aucune vérification de session ici — c'est la RLS qui tranche.
 * Le rôle `anon` n'a ni policy ni GRANT sur `events` (migration du Lot 5),
 * donc cette query ne peut rien retourner à un visiteur non authentifié.
 * C'est le critère de sortie « aucun événement privé n'est exposé
 * publiquement », garanti en base et non par le code appelant.
 */

import { createClient } from '@/lib/supabase/server'
import { isTestEvent } from '../domain/event-rules'
import type { EventSourceType, EventType, ProjectEventWithProject } from '../types'

const DEFAULT_LIMIT = 100

type EventRow = {
  id: string
  type: EventType
  source_type: EventSourceType
  source_id: string
  project_id: string
  occurred_at: string
  projects: { name: string } | null
}

type ListRecentEventsOptions = {
  /**
   * Inclut les événements produits par le test E2E, qui écrit dans la base de
   * production à chaque exécution (DT-Lot5-02). Faux par défaut : la cadence
   * affichée doit être la cadence réelle.
   *
   * Le journal étant append-only, ces événements ne peuvent pas être
   * supprimés — ils sont écartés à la lecture. Le test E2E a besoin de cette
   * option pour vérifier que ses propres événements ont bien été écrits.
   */
  includeTestProjects?: boolean
  limit?: number
}

export async function listRecentEvents({
  includeTestProjects = false,
  limit = DEFAULT_LIMIT,
}: ListRecentEventsOptions = {}): Promise<ProjectEventWithProject[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('events')
    .select('id, type, source_type, source_id, project_id, occurred_at, projects(name)')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[M5] Erreur de lecture du journal des événements :', error)
    return []
  }

  const rows = (data ?? []) as unknown as EventRow[]

  // Le tri des projets de test se fait ici et non en SQL : PostgREST ne filtre
  // pas de façon fiable sur une ressource imbriquée. Conséquence assumée — la
  // liste rendue peut compter moins de `limit` lignes.
  return rows
    .map((row) => ({
      id: row.id,
      type: row.type,
      source_type: row.source_type,
      source_id: row.source_id,
      project_id: row.project_id,
      occurred_at: row.occurred_at,
      project_name: row.projects?.name ?? '(projet inconnu)',
    }))
    .filter((event) => includeTestProjects || !isTestEvent(event.project_name))
}
