'use server'

/**
 * Server Action : Créer un livrable (URL) sur une étape.
 *
 * Chaîne :
 * 1. Vérifie l'authentification.
 * 2. Valide les inputs (stepId, title, description, url).
 * 3. Valide que l'URL est bien formée (http:// ou https://).
 * 4. Récupère le project_id associé à l'étape pour invalider le cache plus tard.
 * 5. Insère le livrable en base avec le statut 'Brouillon'.
 * 6. Invalide le cache de la page projet.
 *
 * Sécurité :
 * - RLS Supabase (deliverables_insert_own) vérifie que l'utilisateur est le propriétaire.
 */

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function createDeliverable(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const stepId = formData.get('step_id')
  const rawTitle = formData.get('title')
  const rawDescription = formData.get('description')
  const rawUrl = formData.get('url')

  if (typeof stepId !== 'string' || typeof rawTitle !== 'string' || typeof rawUrl !== 'string') {
    return { success: false, error: 'Champs obligatoires manquants.' }
  }

  const title = rawTitle.trim()
  const description = typeof rawDescription === 'string' ? rawDescription.trim() : null
  const url = rawUrl.trim()

  // 1. Validation métier des champs
  if (title.length === 0) {
    return { success: false, error: 'Le titre du livrable est obligatoire.' }
  }
  if (title.length > 200) {
    return { success: false, error: 'Le titre ne peut pas dépasser 200 caractères.' }
  }

  if (url.length === 0) {
    return { success: false, error: "L'URL du livrable est obligatoire." }
  }

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return { success: false, error: "L'URL doit commencer par http:// ou https://" }
    }
  } catch {
    return { success: false, error: "Format d'URL invalide." }
  }

  const supabase = await createClient()

  // 2. Vérification session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 3. Récupérer l'étape pour avoir le project_id pour la revalidation du cache
  const { data: step, error: stepError } = await supabase
    .from('method_steps')
    .select('project_id')
    .eq('id', stepId)
    .single()

  if (stepError || !step) {
    return { success: false, error: 'Étape rattachée introuvable.' }
  }

  // 4. Insertion du livrable en base (status par défaut 'Brouillon')
  const { error: insertError } = await supabase.from('deliverables').insert({
    step_id: stepId,
    title,
    description: description || null,
    url,
    status: 'Brouillon',
  })

  if (insertError) {
    return { success: false, error: `Erreur SQL : ${insertError.message}` }
  }

  // 5. Invalidation du cache de la page projet
  revalidatePath(`/dashboard/projects/${step.project_id}`)

  return { success: true }
}
