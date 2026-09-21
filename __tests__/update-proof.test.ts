import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * DT-S25-02 — Ce que ces tests prouvent sur l'action updateProof :
 *
 * 1. le verrou de complétude s'évalue sur l'ÉTAT CANDIDAT (ligne en base +
 *    patch) et AVANT toute écriture — un refus ne laisse rien derrière lui ;
 * 2. l'action n'écrit jamais le statut elle-même : elle délègue, pour que
 *    l'événement CT-11 garde un émetteur unique ;
 * 3. remplir le cas puis le publier en un seul appel fonctionne, parce que
 *    les champs sont écrits avant que le statut ne soit demandé.
 *
 * Supabase est un double : ces tests ne prouvent rien sur le SQL réellement
 * exécuté (même limite qu'events-emission.test.ts, cf. DT-Lot5-09).
 */

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

const COMPLETE_CASE = {
  metier: 'Gestion de réseaux sociaux',
  probleme: 'Aucune conversion malgré un volume de prospects élevé.',
  solution: 'Un CRM de prospection qui qualifie et relance automatiquement.',
  resultat: 'Taux de réponse passé de 4 % à 19 % en six semaines.',
}

/** Ligne courante en « base ». Mutée par les UPDATE, comme le ferait Postgres. */
let proofRow: Record<string, unknown>

const updateSpy = vi.fn()

function makeProofChain() {
  const chain = {
    select: () => chain,
    eq: () => chain,
    update: (patch: Record<string, unknown>) => {
      updateSpy(patch)
      Object.assign(proofRow, patch)
      return chain
    },
    // Copie défensive : le code appelant ne doit pas voir muter la ligne qu'il
    // a lue, sinon le test masquerait un bug de lecture après écriture.
    single: () => Promise.resolve({ data: { ...proofRow }, error: null }),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ error: null }).then(resolve),
  }
  return chain
}

const supabaseDouble = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
  },
  from: () => makeProofChain(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => Promise.resolve(supabaseDouble),
}))

vi.mock('@/modules/m5-mesures/actions/record-event', () => ({
  recordEvent: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Imports APRÈS les vi.mock (hoistés par Vitest).
import { recordEvent } from '@/modules/m5-mesures/actions/record-event'
import { updateProof } from '@/modules/m3-preuves/actions/update-proof'

const recordEventMock = vi.mocked(recordEvent)

/** Repose la ligne « en base » avant chaque test. */
function givenProof(overrides: Record<string, unknown> = {}) {
  proofRow = {
    slug: 'crm-prospection-smm',
    status: 'brouillon',
    metier: null,
    probleme: null,
    solution: null,
    resultat: null,
    deliverables: { method_steps: { project_id: 'project-uuid-1' } },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  recordEventMock.mockResolvedValue({ success: true })
  givenProof()
})

// ---------------------------------------------------------------------------
// Édition d'un brouillon
// ---------------------------------------------------------------------------

describe('updateProof — édition', () => {
  test('un brouillon peut rester incomplet : le verrou ne concerne que le public', async () => {
    const result = await updateProof('proof-1', { metier: 'Gestion de réseaux sociaux' })

    expect(result.success).toBe(true)
    expect(updateSpy).toHaveBeenCalledWith({ metier: 'Gestion de réseaux sociaux' })
  })

  test("n'écrit que les champs fournis — une clé absente n'est pas un effacement", async () => {
    await updateProof('proof-1', { resultat: '+42 % de réponses' })

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenCalledWith({ resultat: '+42 % de réponses' })
  })

  test('une chaîne vide efface un champ nullable', async () => {
    givenProof(COMPLETE_CASE)

    await updateProof('proof-1', { video_url: '   ' })

    expect(updateSpy).toHaveBeenCalledWith({ video_url: null })
  })

  test('refuse de vider une colonne NOT NULL plutôt que de casser la contrainte', async () => {
    const result = await updateProof('proof-1', { summary: '   ' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('summary')
    expect(updateSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Verrou de complétude (DT-S25-02)
// ---------------------------------------------------------------------------

describe('updateProof — verrou de complétude', () => {
  test('refuse la publication d’un cas à trous, sans rien écrire au passage', async () => {
    const incomplete = {
      metier: COMPLETE_CASE.metier,
      probleme: COMPLETE_CASE.probleme,
      solution: COMPLETE_CASE.solution,
    }

    const result = await updateProof('proof-1', { ...incomplete, status: 'publié' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Résultat obtenu')
    expect(updateSpy).not.toHaveBeenCalled()
    expect(recordEventMock).not.toHaveBeenCalled()
  })

  test('une preuve DÉJÀ publiée ne peut pas être vidée en place', async () => {
    givenProof({ ...COMPLETE_CASE, status: 'publié', published_at: '2026-08-01T10:00:00.000Z' })

    const result = await updateProof('proof-1', { probleme: '' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Problème client')
    expect(updateSpy).not.toHaveBeenCalled()
  })

  test('une preuve publiée reste éditable tant que le cas demeure complet', async () => {
    givenProof({ ...COMPLETE_CASE, status: 'publié', published_at: '2026-08-01T10:00:00.000Z' })

    const result = await updateProof('proof-1', { resultat: 'Taux de réponse x4 en six semaines.' })

    expect(result.success).toBe(true)
    expect(updateSpy).toHaveBeenCalledWith({ resultat: 'Taux de réponse x4 en six semaines.' })
  })

  test('le verrou lit le candidat, pas la base : remplir le champ manquant débloque la publication', async () => {
    givenProof({ ...COMPLETE_CASE, resultat: null })

    const result = await updateProof('proof-1', {
      resultat: 'Taux de réponse passé de 4 % à 19 %.',
      status: 'publié',
    })

    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Délégation du statut — émetteur unique de CT-11
// ---------------------------------------------------------------------------

describe('updateProof — statut', () => {
  test('publie en un seul appel : les champs sont écrits avant la transition', async () => {
    const result = await updateProof('proof-1', { ...COMPLETE_CASE, status: 'publié' })

    expect(result.success).toBe(true)

    // 1er UPDATE : les champs du cas. 2e UPDATE : le statut, écrit par
    // updateProofStatus — jamais par updateProof.
    const fieldsPatch = updateSpy.mock.calls[0][0]
    expect(fieldsPatch).not.toHaveProperty('status')
    expect(fieldsPatch).toMatchObject(COMPLETE_CASE)

    const statusPatch = updateSpy.mock.calls[1][0]
    expect(statusPatch.status).toBe('publié')
    expect(statusPatch.published_at).toBeTruthy()
  })

  test('la délégation émet l’événement CT-11 exactement une fois', async () => {
    await updateProof('proof-1', { ...COMPLETE_CASE, status: 'publié' })

    expect(recordEventMock).toHaveBeenCalledTimes(1)
    expect(recordEventMock).toHaveBeenCalledWith({
      type: 'Preuve publiée',
      sourceId: 'proof-1',
      projectId: 'project-uuid-1',
    })
  })

  test('un statut identique à l’actuel ne déclenche aucune transition', async () => {
    givenProof({ ...COMPLETE_CASE, status: 'publié', published_at: '2026-08-01T10:00:00.000Z' })

    await updateProof('proof-1', { metier: 'Artisanat', status: 'publié' })

    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(recordEventMock).not.toHaveBeenCalled()
  })

  test('remonte l’échec de la transition au lieu de le taire', async () => {
    givenProof({ ...COMPLETE_CASE, status: 'archivé' })

    const result = await updateProof('proof-1', { status: 'publié' })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Transition interdite')
  })
})
