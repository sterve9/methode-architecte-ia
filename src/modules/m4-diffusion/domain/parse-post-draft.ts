/**
 * Domaine M4 : découpe la réponse brute du modèle en corps de post
 * et premier commentaire.
 *
 * Fonction pure : testable sans appel API.
 *
 * Tolérante par conception — si le délimiteur est absent (modèle qui ne
 * respecte pas la consigne), on renvoie l'intégralité du texte comme corps
 * de post plutôt que de perdre le contenu généré.
 */

import { FIRST_COMMENT_DELIMITER, type PostDraft } from '../types'

export function parsePostDraft(raw: string): PostDraft {
  const trimmed = raw.trim()
  const delimiterIndex = trimmed.indexOf(FIRST_COMMENT_DELIMITER)

  if (delimiterIndex === -1) {
    return { post: trimmed, firstComment: null }
  }

  const post = trimmed.slice(0, delimiterIndex).trim()
  const firstComment = trimmed
    .slice(delimiterIndex + FIRST_COMMENT_DELIMITER.length)
    .trim()

  return {
    post,
    firstComment: firstComment.length > 0 ? firstComment : null,
  }
}
