/**
 * Types du module M4 Diffusion.
 *
 * Périmètre : diffusion **assistée** uniquement (production d'un brouillon
 * à copier-coller manuellement). La diffusion automatisée sur les canaux
 * externes reste hors MVP (11.Plan_Implementation.md §6, DT-Lot5-04).
 */

/** Canaux de diffusion supportés pour la génération de brouillon. */
export type DiffusionChannel = 'linkedin' | 'x'

/** Limite dure de longueur imposée au canal X (source de vérité unique). */
export const X_MAX_LENGTH = 280

/** Libellés affichables des canaux. */
export const CHANNEL_LABELS: Record<DiffusionChannel, string> = {
  linkedin: 'LinkedIn',
  x: 'X',
}

/**
 * Délimiteur attendu dans la réponse du modèle pour séparer le corps du post
 * de son premier commentaire. Source de vérité partagée entre le constructeur
 * de prompt et le parseur.
 */
export const FIRST_COMMENT_DELIMITER = '===PREMIER_COMMENTAIRE==='

/**
 * Brouillon généré.
 *
 * `firstComment` n'est renseigné que pour LinkedIn : le lien y est sorti du
 * corps du post et déplacé en premier commentaire, l'algorithme de LinkedIn
 * réduisant la portée des publications contenant un lien sortant.
 */
export interface PostDraft {
  post: string
  firstComment: string | null
}

/** Retour de la Server Action de génération. */
export interface GeneratePostResult {
  success: boolean
  draft?: PostDraft
  error?: string
}
