'use server'

/**
 * Server Action : créer un nouveau projet.
 *
 * Chaîne :
 * 1. Vérifie que l'utilisateur est authentifié.
 * 2. Valide les inputs du formulaire (name + business_problem).
 * 3. Appelle la RPC PostgreSQL create_project_with_steps.
 *    - Crée le projet lié à l'utilisateur courant (auth.uid()).
 *    - Clone atomiquement les 13 étapes du canevas v1.0 dans method_steps.
 * 4. Émet l'événement « Projet créé » vers M5 (contrat CT-04).
 * 5. Invalide le cache de la liste des projets.
 * 6. Redirige vers /dashboard/projects.
 *
 * En cas d'erreur : redirige vers /dashboard/projects/new avec ?error=...
 *
 * Sécurité :
 * - L'identité utilisateur est résolue par auth.uid() dans la fonction RPC.
 * - Transaction atomique PostgreSQL (DT-Lot3-04).
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { recordEvent } from '@/modules/m5-mesures/actions/record-event'

const NEW_PROJECT_PATH = '/dashboard/projects/new'
const PROJECTS_LIST_PATH = '/dashboard/projects'

const MAX_NAME_LENGTH = 200
const MAX_BUSINESS_PROBLEM_LENGTH = 5000

function redirectWithError(message: string): never {
  redirect(`${NEW_PROJECT_PATH}?error=${encodeURIComponent(message)}`)
}

export async function createProject(formData: FormData): Promise<void> {
  // 1. Récupération et normalisation des inputs
  const rawName = formData.get('name')
  const rawBusinessProblem = formData.get('business_problem')

  if (typeof rawName !== 'string' || typeof rawBusinessProblem !== 'string') {
    redirectWithError('Formulaire invalide.')
  }

  const name = rawName.trim()
  const businessProblem = rawBusinessProblem.trim()

  // 2. Validation métier
  if (name.length === 0) {
    redirectWithError('Le nom du projet est obligatoire.')
  }
  if (name.length > MAX_NAME_LENGTH) {
    redirectWithError(`Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`)
  }
  if (businessProblem.length === 0) {
    redirectWithError('Le problème métier traité est obligatoire.')
  }
  if (businessProblem.length > MAX_BUSINESS_PROBLEM_LENGTH) {
    redirectWithError(
      `Le problème métier ne peut pas dépasser ${MAX_BUSINESS_PROBLEM_LENGTH} caractères.`
    )
  }

  // 3. Vérification de la session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 4. Insertion atomique via la RPC PL/pgSQL (Projet + 13 Étapes du canevas)
  //    La RPC est déclarée RETURNS UUID : on capte l'identifiant du projet créé,
  //    seul moyen de renseigner l'événement sans requête supplémentaire.
  const { data: newProjectId, error } = await supabase.rpc('create_project_with_steps', {
    p_name: name,
    p_business_problem: businessProblem,
  })

  if (error) {
    redirectWithError(`Erreur lors de la création : ${error.message}`)
  }

  // 5. Contrat CT-04 : signaler la transition initiale (∅ → Idée) à M5.
  //    L'échec de l'instrumentation ne doit jamais empêcher la création :
  //    recordEvent ne lève pas et son résultat n'est volontairement pas testé ici.
  if (typeof newProjectId === 'string') {
    await recordEvent({
      type: 'Projet créé',
      sourceId: newProjectId,
      projectId: newProjectId,
    })
  }

  // 6. Invalidation du cache + redirection
  revalidatePath(PROJECTS_LIST_PATH)
  redirect(PROJECTS_LIST_PATH)
}
