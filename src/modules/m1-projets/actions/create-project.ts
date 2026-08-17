'use server'

/**
 * Server Action : créer un nouveau projet.
 *
 * Chaîne :
 * 1. Vérifie que l'utilisateur est authentifié.
 * 2. Valide les inputs du formulaire (name + business_problem).
 * 3. Insère dans la table projects (user_id injecté côté serveur).
 * 4. Invalide le cache de la liste des projets.
 * 5. Redirige vers /dashboard/projects (feedback visuel : le projet apparaît).
 *
 * En cas d'erreur : redirige vers /dashboard/projects/new avec ?error=...
 *
 * Sécurité :
 * - user_id vient de auth.getUser() côté serveur (jamais du formulaire).
 * - La policy RLS projects_insert_own vérifie que user_id = auth.uid().
 * - Défense en profondeur : validation appli + RLS DB.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

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

  // 4. Insertion en base
  //    Les valeurs par défaut SQL prennent en charge :
  //    - id (gen_random_uuid)
  //    - status ('Idée')
  //    - start_date (CURRENT_DATE)
  //    - created_at / updated_at (now())
  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    name,
    business_problem: businessProblem,
  })

  if (error) {
    redirectWithError(`Erreur lors de la création : ${error.message}`)
  }

  // 5. Invalidation du cache + redirection
  revalidatePath(PROJECTS_LIST_PATH)
  redirect(PROJECTS_LIST_PATH)
}
