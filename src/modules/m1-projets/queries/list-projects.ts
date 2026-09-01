/**
 * Query : lister les projets de l'utilisateur connecté.
 *
 * - Server-only (utilise createClient() serveur).
 * - RLS-safe : la policy projects_select_own filtre automatiquement
 *   sur user_id = auth.uid(). Aucun .eq('user_id', ...) à ajouter.
 * - Tri : plus récents en premier (created_at DESC).
 *
 * Les projets créés par le test E2E (préfixe « [E2E] ») sont **écartés à la
 * lecture**, jamais supprimés — même principe que le journal des mesures, qui
 * les écarte déjà (voir `m5-mesures/domain/event-rules.ts`). Le test écrit
 * dans la base de production (DT-Lot5-02) et en recrée à chaque exécution :
 * les effacer ne tiendrait pas dans le temps, les masquer si.
 *
 * Le préfixe est importé de M5 pour rester une source de vérité unique. Il
 * s'agit d'une constante du domaine, pas d'un accès aux données de M5 : CA-06
 * est respecté, et le précédent existe déjà (M1 importe `recordEvent`).
 *
 * En cas d'erreur DB : throw. L'appelant (Server Component) peut
 * la capturer via error.tsx ou la laisser remonter.
 */

import { createClient } from '@/lib/supabase/server'
import { E2E_PROJECT_PREFIX } from '@/modules/m5-mesures/domain/event-rules'

import type { Project } from '../types'

/**
 * Indique si un projet a été créé par le test E2E.
 *
 * Volontairement distinct de `isTestEvent` de M5, qui porte le même test mais
 * un nom parlant d'événements : l'appeler ici rendrait le code trompeur.
 */
export function isTestProject(name: string): boolean {
  return name.startsWith(E2E_PROJECT_PREFIX)
}

/**
 * @param includeTests true pour inclure les projets « [E2E] … ».
 *        Par défaut ils sont écartés.
 */
export async function listProjects(includeTests = false): Promise<Project[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erreur lors du chargement des projets : ${error.message}`)
  }

  const projects = (data ?? []) as Project[]

  return includeTests
    ? projects
    : projects.filter((project) => !isTestProject(project.name))
}
