'use server'

/**
 * Server Action M4 : générer un brouillon de post pour un canal de diffusion.
 *
 * Chaîne :
 * 1. Vérifie que l'utilisateur est authentifié (la protection ne repose jamais
 *    sur le proxy : voir la note de sécurité dans docs/technique/architecture.md).
 * 2. Récupère la charge utile CT-03 auprès de M3 (M4 ne lit pas public_proofs).
 * 3. Construit le prompt via le domaine (fonction pure).
 * 4. Appelle l'API Claude et renvoie le brouillon.
 *
 * Diffusion assistée uniquement : rien n'est publié, le texte est copié
 * manuellement par l'utilisateur (DT-Lot5-04).
 *
 * Sécurité : ANTHROPIC_API_KEY est un secret serveur. Ce fichier est
 * 'use server', la clé n'est jamais exposée au bundle client.
 */

import Anthropic from '@anthropic-ai/sdk'

import { createClient } from '@/lib/supabase/server'
import { getProofForDiffusion } from '@/modules/m3-preuves/queries/get-proof-for-diffusion'
import { buildPostPrompt } from '../domain/build-post-prompt'
import { resolveSiteUrl } from '@/lib/site-url'
import { parsePostDraft } from '../domain/parse-post-draft'
import type { DiffusionChannel, GeneratePostResult } from '../types'

const MODEL = 'claude-opus-5'
const MAX_TOKENS = 8000

export async function generatePostDraft(
  proofId: string,
  channel: DiffusionChannel
): Promise<GeneratePostResult> {
  // 1. Vérification de session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Non authentifié' }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error:
        "Clé ANTHROPIC_API_KEY absente. Ajoute-la dans .env.local puis relance le serveur.",
    }
  }

  // 2. Charge utile CT-03 émise par M3
  const proof = await getProofForDiffusion(proofId)

  if (!proof) {
    return { success: false, error: 'Preuve publiée introuvable.' }
  }

  // 3. Construction du prompt (domaine pur)
  const publicUrl = `${resolveSiteUrl()}/p/${proof.slug}`
  const prompt = buildPostPrompt(channel, proof, publicUrl)

  // 4. Appel API
  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      output_config: { effort: 'medium' },
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
    })

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    if (!rawText) {
      return { success: false, error: "Le modèle n'a renvoyé aucun texte." }
    }

    return { success: true, draft: parsePostDraft(rawText) }
  } catch (error) {
    console.error('[generatePostDraft] Erreur API :', error)

    if (error instanceof Anthropic.AuthenticationError) {
      return { success: false, error: 'Clé API refusée. Vérifie ANTHROPIC_API_KEY.' }
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { success: false, error: 'Limite de débit atteinte. Réessaie dans un instant.' }
    }
    if (error instanceof Anthropic.APIError) {
      return { success: false, error: `Erreur API (${error.status}) : ${error.message}` }
    }

    return { success: false, error: 'Erreur inattendue pendant la génération.' }
  }
}
