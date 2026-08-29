/**
 * Domaine M4 : construction du prompt de génération d'un brouillon de post.
 *
 * Fonction pure : aucun import Supabase, Next ou Anthropic.
 * C'est la pièce testable unitairement du module (même rôle que
 * m3-preuves/domain/proof-rules.ts).
 */

import type { ProofDiffusionPayload } from '@/modules/m3-preuves/types'
import {
  FIRST_COMMENT_DELIMITER,
  X_MAX_LENGTH,
  type DiffusionChannel,
} from '../types'

export interface PostPrompt {
  system: string
  user: string
}

const SHARED_SYSTEM = `Tu rédiges des publications pour un architecte IA indépendant qui documente publiquement sa méthode de travail, projet après projet. Chaque publication renvoie vers une "preuve" : la fiche publique d'un livrable réel qu'il a produit.

Son objectif est d'attirer des missions en montrant du travail concret, pas de faire du volume.

Règles de rédaction, sans exception :
- Écris en français, à la première personne.
- Pars d'un fait concret ou d'un chiffre issu du contexte fourni. Jamais d'introduction générique sur l'IA ou la transformation digitale.
- Bannis le jargon creux : "révolutionner", "game changer", "disruptif", "passionné par", "ravi de partager", "l'IA change tout".
- Pas d'emojis en début de ligne comme puces. Pas de mur de hashtags.
- N'invente jamais un chiffre, un client, un résultat ou une techno qui n'est pas dans le contexte fourni. Si le contexte est mince, reste factuel et court plutôt que de broder.
- Renvoie uniquement le texte demandé, prêt à copier-coller, en respectant exactement le format de sortie indiqué pour le canal. Aucun préambule, aucune explication de ta part, aucune option alternative, aucun guillemet englobant.`

const CHANNEL_INSTRUCTIONS: Record<DiffusionChannel, string> = {
  linkedin: `Canal : LinkedIn.

Format attendu pour le corps du post :
- Une accroche d'une à deux lignes qui pose le problème réel ou le chiffre marquant.
- Trois à cinq courts paragraphes qui racontent ce qui a été fait et ce que ça a produit.
- Une ligne de clôture qui invite à consulter le lien en commentaire.
- Au maximum trois hashtags pertinents, sur la dernière ligne.

Longueur cible du corps : 900 à 1300 caractères.

CONTRAINTE ABSOLUE : le corps du post ne doit contenir AUCUNE URL. LinkedIn
réduit la portée des publications comportant un lien sortant, le lien part donc
en premier commentaire.

Structure ta réponse exactement ainsi, délimiteur compris :

<corps du post, sans aucune URL>
${FIRST_COMMENT_DELIMITER}
<premier commentaire : une phrase courte suivie de l'URL de la preuve>`,

  x: `Canal : X (ex-Twitter).

Format attendu :
- Un seul tweet, ${X_MAX_LENGTH} caractères maximum, URL incluse.
- Une seule idée : le fait le plus marquant du projet.
- L'URL de la preuve doit figurer dans le tweet.
- Au maximum un hashtag, et seulement s'il apporte quelque chose.

La contrainte de ${X_MAX_LENGTH} caractères est absolue : compte-les.`,
}

/**
 * Construit le prompt (system + user) pour générer un brouillon de post
 * à partir de la charge utile CT-03 d'une preuve publiée.
 *
 * @param channel Canal de diffusion visé.
 * @param proof Charge utile émise par M3 (contrat CT-03).
 * @param publicUrl URL publique absolue de la fiche de preuve.
 */
export function buildPostPrompt(
  channel: DiffusionChannel,
  proof: ProofDiffusionPayload,
  publicUrl: string
): PostPrompt {
  const contextLines: string[] = [
    `Titre de la preuve : ${proof.title}`,
    `Format : ${proof.format}`,
    `Résumé de la valeur apportée : ${proof.summary}`,
    `URL publique de la preuve : ${publicUrl}`,
  ]

  if (proof.project_name) {
    contextLines.push(`Projet d'origine : ${proof.project_name}`)
  }

  if (proof.project_business_problem) {
    contextLines.push(
      `Problème métier réel traité par ce projet : ${proof.project_business_problem}`
    )
  }

  if (proof.context) {
    contextLines.push(`Contexte et méthodologie : ${proof.context}`)
  }

  if (proof.deliverable_url) {
    contextLines.push(`Livrable source : ${proof.deliverable_url}`)
  }

  return {
    system: `${SHARED_SYSTEM}\n\n${CHANNEL_INSTRUCTIONS[channel]}`,
    user: `Rédige le post à partir de ce contexte réel :\n\n${contextLines.join('\n')}`,
  }
}
