import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { EVENT_TYPES } from '@/modules/m5-mesures/domain/event-rules'
import { listRecentEvents } from '@/modules/m5-mesures/queries/list-recent-events'
import type { EventType } from '@/modules/m5-mesures/types'

/**
 * Page M5 Mesures : consultation interne du journal des événements.
 *
 * Route : /dashboard/mesures
 *
 * Périmètre volontairement étroit (11.Plan_Implementation.md, Lot 5) :
 * « consultation interne des événements (vue simple, pas de dashboard
 * analytique) ». Une liste antéchronologique et quatre totaux — aucun
 * graphique, aucun agrégat temporel.
 *
 * Sécurité : vérification de session explicite ici, en défense en profondeur
 * de l'allowlist du proxy (DT-Lot5-07). Côté données, la RLS de `events`
 * n'accorde rien au rôle `anon`.
 */

const EVENT_BADGE_STYLE: Record<EventType, string> = {
  'Projet créé': 'bg-blue-50 text-blue-700 border-blue-200',
  'Étape terminée': 'bg-green-50 text-green-700 border-green-200',
  'Livrable attaché': 'bg-amber-50 text-amber-700 border-amber-200',
  'Preuve publiée': 'bg-purple-50 text-purple-700 border-purple-200',
}

function formatOccurredAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function MesuresPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const includeTestProjects = params.tests === '1'

  const events = await listRecentEvents({ includeTestProjects })

  const totals = EVENT_TYPES.map((type) => ({
    type,
    count: events.filter((event) => event.type === type).length,
  }))

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <nav>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Retour au dashboard
          </Link>
        </nav>

        <header>
          <h1 className="text-2xl font-bold text-gray-900">Mesures</h1>
          <p className="mt-2 text-sm text-gray-600">
            Journal des événements clés de la chaîne de valeur. Il est
            append-only : rien n&apos;y est modifié ni supprimé, jamais.
          </p>
        </header>

        <section aria-label="Totaux par type d'événement">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {totals.map(({ type, count }) => (
              <li
                key={type}
                className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-gray-900" data-testid={`total-${type}`}>
                  {count}
                </p>
                <p className="mt-1 text-xs text-gray-600">{type}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Journal des événements" className="space-y-3">
          {events.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              Aucun événement enregistré pour le moment. Crée un projet, termine
              une étape, attache un livrable ou publie une preuve pour alimenter
              le journal.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {events.map((event) => (
                <li
                  key={event.id}
                  data-testid="event-row"
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${EVENT_BADGE_STYLE[event.type]}`}
                    >
                      {event.type}
                    </span>
                    <Link
                      href={`/dashboard/projects/${event.project_id}`}
                      className="text-sm font-medium text-gray-900 hover:underline"
                    >
                      {event.project_name}
                    </Link>
                  </div>
                  <time
                    dateTime={event.occurred_at}
                    className="text-xs tabular-nums text-gray-500"
                  >
                    {formatOccurredAt(event.occurred_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="border-t border-gray-100 pt-4 text-xs text-gray-500">
          {includeTestProjects ? (
            <p>
              Les événements des projets de test (« [E2E] … ») sont{' '}
              <strong>inclus</strong>.{' '}
              <Link href="/dashboard/mesures" className="text-blue-600 hover:underline">
                Revenir à la cadence réelle
              </Link>
            </p>
          ) : (
            <p>
              Les événements des projets de test (« [E2E] … ») sont écartés de
              cette vue pour ne pas fausser la cadence. Ils restent en base : le
              journal ne se réécrit pas.{' '}
              <Link
                href="/dashboard/mesures?tests=1"
                className="text-blue-600 hover:underline"
              >
                Les afficher quand même
              </Link>
            </p>
          )}
        </footer>
      </div>
    </main>
  )
}
