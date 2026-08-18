'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { assertCanTransition } from '../domain/transitions';

/**
 * Server Action : archive un projet.
 *
 * L'archivage est une transition terminale et irréversible (E6).
 * Il exige une raison textuelle obligatoire, stockée pour référence future.
 *
 * Règles métier (docs/methode/05.Cycle_de_Vie.md section 4bis) :
 * - Seules les transitions T6 (Livré → Archivé), T7 (En cours → Archivé)
 *   et T8 (En pause → Archivé) sont autorisées.
 * - La raison d'archivage est obligatoire (validation applicative,
 *   voir DT-Lot2-01 dans docs/technique/decisions.md).
 *
 * Redirige vers la page détail du projet en cas de succès.
 * Jette une erreur en cas de :
 * - id ou reason manquant/vide
 * - Projet inexistant (ou appartenant à un autre user, via RLS)
 * - Statut actuel n'autorisant pas l'archivage
 * - Erreur Supabase
 */
export async function archiveProject(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString().trim();
  const reason = formData.get('reason')?.toString().trim();

  if (!id) {
    throw new Error('Identifiant du projet manquant');
  }
  if (!reason) {
    throw new Error('La raison d\'archivage est obligatoire');
  }

  const supabase = await createClient();

  // Récupérer le statut actuel pour vérifier la transition
  const { data: current, error: fetchError } = await supabase
    .from('projects')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[archiveProject] Fetch error:', fetchError);
    throw new Error('Erreur lors de la récupération du projet');
  }

  if (!current) {
    throw new Error('Projet introuvable');
  }

  // Vérifier la transition vers Archivé (jette si interdite)
  assertCanTransition(current.status, 'Archivé');

  // Effectuer l'UPDATE : statut + raison en une seule opération
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      status: 'Archivé',
      archive_reason: reason,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[archiveProject] Update error:', updateError);
    throw new Error('Erreur lors de l\'archivage du projet');
  }

  // Invalider les caches Next
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${id}`);

  // Rediriger vers la page détail (l'utilisateur verra le statut Archivé + la raison)
  redirect(`/dashboard/projects/${id}`);
}
