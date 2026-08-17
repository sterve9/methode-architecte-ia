import { createClient } from '@/lib/supabase/server';
import type { Project } from '../types';

/**
 * Récupère un projet par son id.
 *
 * Retourne null si :
 * - Le projet n'existe pas
 * - Le projet appartient à un autre utilisateur (filtré par RLS)
 *
 * Les deux cas sont volontairement indistinguables côté appelant
 * pour ne pas révéler l'existence de projets d'autres utilisateurs.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[getProjectById] Supabase error:', error);
    throw new Error('Erreur lors de la récupération du projet');
  }

  return data;
}
