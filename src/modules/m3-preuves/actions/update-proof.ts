'use server'

/**
 * Server Action M3 : Éditer une Preuve Publique (étude de cas).
 *
 * Introduite par DT-S25-02 : sans elle, les 5 champs de l'étude de cas ne
 * seraient remplissables qu'à la création, donc jamais corrigeables.
 *
 * Deux garanties portées ici :
 *
 * 1. Le statut n'est PAS écrit par cette action. Si l'appelant en demande un,
 *    elle délègue à updateProofStatus, qui reste le seul point d'écriture du
 *    statut et le seul émetteur de l'événement CT-11. Dupliquer cette logique
 *    ferait compter deux fois la même preuve dans un journal append-only.
 *    L'ordre est volontaire — champs d'abord, statut ensuite : remplir le cas
 *    puis le publier en un seul appel doit fonctionner, et le verrou de
 *    publication doit s'évaluer sur les valeurs fraîchement enregistrées.
 *
 * 2. Une preuve DÉJÀ publiée ne peut pas être vidée en place. L'édition est
 *    évaluée sur l'état candidat (ligne en base + patch) avant toute écriture :
 *    la vitrine n'affiche jamais un cas à trous, ni à la publication, ni après.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getPublicationBlockingReason } from '../domain/proof-rules'
import type { ProofStatus, UpdateProofInput } from '../types'
import { updateProofStatus } from './update-proof-status'

type EditableProofRow = {
  slug: string
  status: ProofStatus
  metier: string | null
  probleme: string | null
  solution: string | null
  resultat: string | null
  deliverables: {
    method_steps: {
      project_id: string
    } | null
  } | null
}

/** Champs texte librement éditables, hors statut (géré par délégation). */
const EDITABLE_TEXT_FIELDS = [
  'title',
  'slug',
  'summary',
  'metier',
  'probleme',
  'solution',
  'resultat',
  'video_url',
  'image_url',
  'format',
  'context',
] as const

/** Champs qui ne tolèrent pas NULL en base (contraintes de la table). */
const NON_NULLABLE_FIELDS = new Set<string>(['title', 'slug', 'summary', 'format'])

export async function updateProof(
  proofId: string,
  input: UpdateProofInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Vérification session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  // 2. Récupérer l'état courant (champs soumis au verrou + projet porteur)
  const { data, error: fetchError } = await supabase
    .from('public_proofs')
    .select(
      'slug, status, metier, probleme, solution, resultat, deliverables(method_steps(project_id))'
    )
    .eq('id', proofId)
    .single()

  if (fetchError || !data) {
    return { success: false, error: 'Preuve introuvable.' }
  }

  const current = data as unknown as EditableProofRow

  // 3. Construire le patch : seules les clés réellement fournies sont écrites.
  //    Une chaîne vide vaut NULL, sauf pour les colonnes NOT NULL, où elle est
  //    simplement rejetée (on ne casse pas une contrainte de table en silence).
  const patch: Record<string, string | null> = {}

  for (const field of EDITABLE_TEXT_FIELDS) {
    const raw = input[field]
    if (raw === undefined) continue

    const trimmed = raw.trim()

    if (trimmed.length === 0) {
      if (NON_NULLABLE_FIELDS.has(field)) {
        return { success: false, error: `Le champ « ${field} » ne peut pas être vidé.` }
      }
      patch[field] = null
      continue
    }

    patch[field] = trimmed
  }

  // 4. État candidat = base + patch. Évalué AVANT écriture.
  const candidate = {
    metier: 'metier' in patch ? patch.metier : current.metier,
    probleme: 'probleme' in patch ? patch.probleme : current.probleme,
    solution: 'solution' in patch ? patch.solution : current.solution,
    resultat: 'resultat' in patch ? patch.resultat : current.resultat,
  }

  // 5. Verrou de complétude (DT-S25-02), dans les deux situations où l'édition
  //    aboutit à une preuve visible du public : elle l'est déjà et le reste, ou
  //    l'appelant demande la publication dans le même geste.
  const staysPublished = current.status === 'publié' && input.status !== 'brouillon' && input.status !== 'archivé'
  const asksPublication = input.status === 'publié'

  if (staysPublished || asksPublication) {
    const blockingReason = getPublicationBlockingReason(candidate)
    if (blockingReason) {
      return { success: false, error: blockingReason }
    }
  }

  // 6. Écriture des champs
  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await supabase
      .from('public_proofs')
      .update(patch)
      .eq('id', proofId)

    if (updateError) {
      console.error('Erreur mise à jour preuve :', updateError)
      return { success: false, error: `Erreur SQL : ${updateError.message}` }
    }
  }

  // 7. Statut : délégué, jamais écrit ici (voir en-tête).
  if (input.status && input.status !== current.status) {
    const statusResult = await updateProofStatus(proofId, input.status)
    if (!statusResult.success) {
      return statusResult
    }
  }

  // 8. Invalidation du cache — ancien ET nouveau slug si l'URL publique bouge.
  const newSlug = typeof patch.slug === 'string' ? patch.slug : current.slug
  const projectId = current.deliverables?.method_steps?.project_id ?? null

  revalidatePath('/p')
  revalidatePath(`/p/${current.slug}`)
  if (newSlug !== current.slug) {
    revalidatePath(`/p/${newSlug}`)
  }
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`)
  }

  return { success: true }
}
