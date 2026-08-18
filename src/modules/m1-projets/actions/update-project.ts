'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { assertCanTransition } from '../domain/transitions';
import type { ProjectStatus } from '../types';

/**
 * Server Action : met à jour un projet existant.
 *
 * Vérifie toute véritable transition de statut selon les règles définies
 * dans docs/methode/05.Cycle_de_Vie.md.
 *
 * Une modification du nom ou du problème métier sans changement de statut
 * reste autorisée.
 *
 * Redirige vers la page détail du projet en cas de succès.
 */
export async function updateProject(formData: FormData): Promise<void> {
  const id = formData.get('id')?.toString().trim();
  const name = formData.get('name')?.toString().trim();
  const businessProblem = formData.get('business_problem')?.toString().trim();
  const newStatus = formData.get('status')?.toString().trim() as ProjectStatus;

  if (!id || !name || !businessProblem || !newStatus) {
    throw new Error('Tous les champs sont obligatoires');
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from('projects')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[updateProject] Fetch error:', fetchError);
    throw new Error('Erreur lors de la récupération du projet');
  }

  if (!current) {
    throw new Error('Projet introuvable');
  }

  /*
   * Conserver le même statut est autorisé lorsque l'utilisateur modifie
   * seulement le nom ou le problème métier.
   *
   * Toute véritable modification de statut doit respecter le cycle de vie.
   */
  if (current.status !== newStatus) {
    assertCanTransition(current.status, newStatus);
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      name,
      business_problem: businessProblem,
      status: newStatus,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[updateProject] Update error:', updateError);
    throw new Error('Erreur lors de la mise à jour du projet');
  }

  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${id}`);

  redirect(`/dashboard/projects/${id}`);
}
