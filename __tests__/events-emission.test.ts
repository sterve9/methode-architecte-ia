import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * Exigence 12.Strategie_Tests.md §166 (Lot 5) :
 * « tests unitaires vérifiant que chaque événement clé est bien émis ».
 *
 * Ce que ces tests prouvent : les 4 Server Actions appellent recordEvent()
 * avec la bonne charge utile, et ne l'appellent PAS hors des cas prévus par
 * les contrats CT-04 / CT-10 / CT-11.
 *
 * Ce qu'ils NE prouvent PAS : que la ligne atterrit réellement dans la table
 * `events` — Supabase est ici un double. C'est le rôle du test E2E sur la
 * chaîne critique, conformément à la leçon de la S22 (voir DT-Lot5-09).
 */

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

type SupabaseChain = {
  select: (...args: unknown[]) => SupabaseChain
  eq: (...args: unknown[]) => SupabaseChain
  insert: (...args: unknown[]) => SupabaseChain
  update: (...args: unknown[]) => SupabaseChain
  single: () => Promise<unknown>
  then: (resolve: (value: unknown) => unknown) => Promise<unknown>
}

/**
 * Reproduit le chaînage de supabase-js : chaque méthode renvoie le maillon
 * suivant, et le maillon est lui-même « awaitable » pour les requêtes qui ne
 * se terminent pas par .single() (cas de l'UPDATE).
 */
function makeChain(result: unknown): SupabaseChain {
  const chain: SupabaseChain = {
    select: () => chain,
    eq: () => chain,
    insert: () => chain,
    update: () => chain,
    single: () => Promise.resolve(result),
    then: (resolve) => Promise.resolve(result).then(resolve),
  }
  return chain
}

const rpcMock = vi.fn()
const fromMock = vi.fn()

const supabaseDouble = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
  },
  rpc: rpcMock,
  from: fromMock,
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

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Imports APRÈS les vi.mock (hoistés par Vitest).
import { recordEvent } from '@/modules/m5-mesures/actions/record-event'
import { createProject } from '@/modules/m1-projets/actions/create-project'
import { createDeliverable } from '@/modules/m2-methode/actions/create-deliverable'
import { updateStepStatus } from '@/modules/m2-methode/actions/update-step-status'
import { updateProofStatus } from '@/modules/m3-preuves/actions/update-proof-status'

const recordEventMock = vi.mocked(recordEvent)

/** Associe un résultat figé à chaque table interrogée pendant le test. */
function stubTables(results: Record<string, unknown>) {
  fromMock.mockImplementation((table: string) => makeChain(results[table]))
}

beforeEach(() => {
  vi.clearAllMocks()
  recordEventMock.mockResolvedValue({ success: true })
})

// ---------------------------------------------------------------------------
// CT-04 — M1 vers M5 : Projet créé
// ---------------------------------------------------------------------------

describe('createProject — événement « Projet créé » (CT-04)', () => {
  const validForm = () => {
    const form = new FormData()
    form.set('name', 'Refonte du tunnel de prospection')
    form.set('business_problem', 'Aucune conversion malgré un volume élevé.')
    return form
  }

  test("émet l'événement avec l'UUID retourné par la RPC", async () => {
    rpcMock.mockResolvedValue({ data: 'project-uuid-1', error: null })
    stubTables({})

    await createProject(validForm())

    expect(recordEventMock).toHaveBeenCalledTimes(1)
    expect(recordEventMock).toHaveBeenCalledWith({
      type: 'Projet créé',
      sourceId: 'project-uuid-1',
      projectId: 'project-uuid-1',
    })
  })

  test("n'émet rien si la création du projet échoue", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'échec RPC' } })
    stubTables({})

    await createProject(validForm())

    expect(recordEventMock).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// CT-10 — M2 vers M5 : Étape terminée
// ---------------------------------------------------------------------------

describe('updateStepStatus — événement « Étape terminée » (CT-10)', () => {
  const stepRow = {
    data: { id: 'step-1', status: 'En cours', project_id: 'project-uuid-1' },
    error: null,
  }

  test("émet l'événement quand l'étape passe à Terminée", async () => {
    stubTables({ method_steps: stepRow })

    const result = await updateStepStatus('step-1', 'Terminée')

    expect(result.success).toBe(true)
    expect(recordEventMock).toHaveBeenCalledTimes(1)
    expect(recordEventMock).toHaveBeenCalledWith({
      type: 'Étape terminée',
      sourceId: 'step-1',
      projectId: 'project-uuid-1',
    })
  })

  test("n'émet rien sur un simple retour à « À faire »", async () => {
    stubTables({ method_steps: stepRow })

    const result = await updateStepStatus('step-1', 'À faire')

    expect(result.success).toBe(true)
    expect(recordEventMock).not.toHaveBeenCalled()
  })

  test("n'émet rien si la transition est refusée par le domaine", async () => {
    stubTables({
      method_steps: {
        data: { id: 'step-1', status: 'À faire', project_id: 'project-uuid-1' },
        error: null,
      },
    })

    const result = await updateStepStatus('step-1', 'Terminée')

    expect(result.success).toBe(false)
    expect(recordEventMock).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// CT-10 — M2 vers M5 : Livrable attaché
// ---------------------------------------------------------------------------

describe('createDeliverable — événement « Livrable attaché » (CT-10)', () => {
  const validForm = () => {
    const form = new FormData()
    form.set('step_id', 'step-1')
    form.set('title', 'Dossier de cadrage')
    form.set('url', 'https://example.com/cadrage')
    return form
  }

  test("émet l'événement avec l'identifiant du livrable inséré", async () => {
    stubTables({
      method_steps: { data: { project_id: 'project-uuid-1' }, error: null },
      deliverables: { data: { id: 'deliverable-1' }, error: null },
    })

    const result = await createDeliverable(validForm())

    expect(result.success).toBe(true)
    expect(recordEventMock).toHaveBeenCalledTimes(1)
    expect(recordEventMock).toHaveBeenCalledWith({
      type: 'Livrable attaché',
      sourceId: 'deliverable-1',
      projectId: 'project-uuid-1',
    })
  })

  test("n'émet rien si l'insertion échoue", async () => {
    stubTables({
      method_steps: { data: { project_id: 'project-uuid-1' }, error: null },
      deliverables: { data: null, error: { message: 'violation RLS' } },
    })

    const result = await createDeliverable(validForm())

    expect(result.success).toBe(false)
    expect(recordEventMock).not.toHaveBeenCalled()
  })

  test("n'émet rien si l'URL est invalide (rejet avant tout accès base)", async () => {
    const form = validForm()
    form.set('url', 'ftp://example.com/cadrage')
    stubTables({})

    const result = await createDeliverable(form)

    expect(result.success).toBe(false)
    expect(recordEventMock).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// CT-11 — M3 vers M5 : Preuve publiée
// ---------------------------------------------------------------------------

describe('updateProofStatus — événement « Preuve publiée » (CT-11)', () => {
  const draftProof = {
    data: {
      status: 'brouillon',
      slug: 'refonte-tunnel',
      deliverable_id: 'deliverable-1',
      published_at: null,
      deliverables: { method_steps: { project_id: 'project-uuid-1' } },
    },
    error: null,
  }

  test("émet l'événement à la première publication, avec le projet porteur", async () => {
    stubTables({ public_proofs: draftProof })

    const result = await updateProofStatus('proof-1', 'publié')

    expect(result.success).toBe(true)
    expect(recordEventMock).toHaveBeenCalledTimes(1)
    expect(recordEventMock).toHaveBeenCalledWith({
      type: 'Preuve publiée',
      sourceId: 'proof-1',
      projectId: 'project-uuid-1',
    })
  })

  test("n'émet rien lors d'une republication : la cadence ne compte pas deux fois la même preuve", async () => {
    stubTables({
      public_proofs: {
        data: { ...draftProof.data, published_at: '2026-08-01T10:00:00.000Z' },
        error: null,
      },
    })

    const result = await updateProofStatus('proof-1', 'publié')

    expect(result.success).toBe(true)
    expect(recordEventMock).not.toHaveBeenCalled()
  })

  test("n'émet rien sur un retrait de la vitrine", async () => {
    stubTables({
      public_proofs: {
        data: { ...draftProof.data, status: 'publié', published_at: '2026-08-01T10:00:00.000Z' },
        error: null,
      },
    })

    const result = await updateProofStatus('proof-1', 'archivé')

    expect(result.success).toBe(true)
    expect(recordEventMock).not.toHaveBeenCalled()
  })
})
