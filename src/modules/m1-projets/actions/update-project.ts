'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { assertCanTransition } from '../domain/transitions';
import type { ProjectStatus } from '../types';

/**
 * Server Action : met à jour un projet existant.
 *
 * Vérifie que la transition de statut est autorisée par la méthode
 * (voir docs/methode/05.Cycle_de_Vie.md).
 *
 * Redirige vers la page détail du projet en cas de succès.
 * Jette une erreur en cas de :
 * - Champs manquants ou vides
 * - Projet inexistant (ou appartenant à un autre user, via RLS)
 * - Transition de statut interdite
 * - Erreur Supabase
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

  // Récupérer le statut actuel pour vérifier la transition
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

  // Vérifier la transition (jette si interdite)
  assertCanTransition(current.status, newStatus);

  // Effectuer l'UPDATE
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

  // Invalider les caches Next
  revalidatePath('/dashboard/projects');
  revalidatePath(`/dashboard/projects/${id}`);

  // Rediriger vers la page détail
  redirect(`/dashboard/projects/${id}`);
}
