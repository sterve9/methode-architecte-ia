import { describe, expect, test } from 'vitest'

import { buildPostPrompt } from '@/modules/m4-diffusion/domain/build-post-prompt'
import { parsePostDraft } from '@/modules/m4-diffusion/domain/parse-post-draft'
import { FIRST_COMMENT_DELIMITER, X_MAX_LENGTH } from '@/modules/m4-diffusion/types'
import type { ProofDiffusionPayload } from '@/modules/m3-preuves/types'

const PUBLIC_URL = 'https://methode-architecte-ia.vercel.app/p/crm-prospection-smm'

const FULL_PROOF: ProofDiffusionPayload = {
  id: 'proof-1',
  title: 'Cadrage CRM Prospection SMM',
  slug: 'crm-prospection-smm',
  format: 'Récit de compétence',
  summary: '59 prospects contactés, 0 conversion : diagnostic et refonte du tunnel.',
  context: 'Projet mené sous contrainte avec Next.js et Supabase.',
  deliverable_url: 'https://example.com/livrable',
  project_name: 'CRM Prospection SMM',
  project_business_problem: 'Aucune conversion malgré un volume de prospection élevé.',
}

describe('buildPostPrompt', () => {
  test('injecte le titre, le résumé et l’URL publique dans le prompt', () => {
    const prompt = buildPostPrompt('linkedin', FULL_PROOF, PUBLIC_URL)

    expect(prompt.user).toContain(FULL_PROOF.title)
    expect(prompt.user).toContain(FULL_PROOF.summary)
    expect(prompt.user).toContain(PUBLIC_URL)
  })

  test('transmet le contexte projet, qui n’est pas visible côté public', () => {
    const prompt = buildPostPrompt('linkedin', FULL_PROOF, PUBLIC_URL)

    expect(prompt.user).toContain(FULL_PROOF.project_name!)
    expect(prompt.user).toContain(FULL_PROOF.project_business_problem!)
  })

  test('impose la contrainte de longueur sur le canal X uniquement', () => {
    const forX = buildPostPrompt('x', FULL_PROOF, PUBLIC_URL)
    const forLinkedIn = buildPostPrompt('linkedin', FULL_PROOF, PUBLIC_URL)

    expect(forX.system).toContain(String(X_MAX_LENGTH))
    expect(forLinkedIn.system).not.toContain(String(X_MAX_LENGTH))
  })

  test('omet proprement les champs optionnels absents', () => {
    const minimalProof: ProofDiffusionPayload = {
      ...FULL_PROOF,
      context: null,
      deliverable_url: null,
      project_name: null,
      project_business_problem: null,
    }

    const prompt = buildPostPrompt('linkedin', minimalProof, PUBLIC_URL)

    expect(prompt.user).toContain(minimalProof.title)
    expect(prompt.user).not.toContain('null')
    expect(prompt.user).not.toContain('undefined')
  })

  test('interdit explicitement d’inventer des chiffres', () => {
    const prompt = buildPostPrompt('linkedin', FULL_PROOF, PUBLIC_URL)

    expect(prompt.system).toContain("N'invente jamais")
  })

  test('demande le lien en premier commentaire sur LinkedIn uniquement', () => {
    const forLinkedIn = buildPostPrompt('linkedin', FULL_PROOF, PUBLIC_URL)
    const forX = buildPostPrompt('x', FULL_PROOF, PUBLIC_URL)

    expect(forLinkedIn.system).toContain(FIRST_COMMENT_DELIMITER)
    expect(forX.system).not.toContain(FIRST_COMMENT_DELIMITER)
  })
})

describe('parsePostDraft', () => {
  test('sépare le corps du post et le premier commentaire', () => {
    const raw = `Voici le post.\n\n#Archi\n${FIRST_COMMENT_DELIMITER}\nLa preuve complète : ${PUBLIC_URL}`

    const draft = parsePostDraft(raw)

    expect(draft.post).toBe('Voici le post.\n\n#Archi')
    expect(draft.firstComment).toBe(`La preuve complète : ${PUBLIC_URL}`)
  })

  test('renvoie tout le texte en corps si le délimiteur est absent', () => {
    const draft = parsePostDraft('  Un post sans délimiteur.  ')

    expect(draft.post).toBe('Un post sans délimiteur.')
    expect(draft.firstComment).toBeNull()
  })

  test('traite un commentaire vide comme absent', () => {
    const draft = parsePostDraft(`Le post.\n${FIRST_COMMENT_DELIMITER}\n   `)

    expect(draft.post).toBe('Le post.')
    expect(draft.firstComment).toBeNull()
  })
})
