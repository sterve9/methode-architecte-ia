import Link from 'next/link'
import { redirect } from 'next/navigation'

import { listProjects } from '@/modules/m1-projets/queries/list-projects'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/modules/m1-projets/types'

/**
 * Page : liste des projets de l'utilisateur connecté.
 *
 * - Server Component.
 * - Protégée par vérification de session (défense en profondeur).
 * - Utilise la query listProjects() qui s'appuie sur RLS.
 * - Affiche :
 *   - Un en-tête avec titre + bouton "Nouveau projet".
 *   - Une liste de cartes (une par projet).
 *   - Un état vide riche si aucun projet.
 */
export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const projects = await listProjects()

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Retour au dashboard
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mes projets
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {projects.length === 0
                ? 'Aucun projet pour le moment.'
                : `${projects.length} projet${projects.length > 1 ? 's' : ''}.`}
            </p>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            + Nouveau projet
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const excerpt =
    project.business_problem.length > 100
      ? `${project.business_problem.slice(0, 100)}…`
      : project.business_problem

  const formattedDate = new Date(project.start_date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-gray-900">
            {project.name}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{excerpt}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Démarré le {formattedDate}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const colorClasses: Record<Project['status'], string> = {
    'Idée': 'bg-gray-100 text-gray-800',
    'Cadré': 'bg-blue-100 text-blue-800',
    'En cours': 'bg-green-100 text-green-800',
    'En pause': 'bg-yellow-100 text-yellow-800',
    'Livré': 'bg-purple-100 text-purple-800',
    'Archivé': 'bg-gray-100 text-gray-500',
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[status]}`}
    >
      {status}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="rounded-lg bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">
        Aucun projet pour l&apos;instant
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
        Un projet est une unité de travail concrète qui applique la méthode
        pour résoudre un problème réel et produire des preuves publiques.
      </p>
      <div className="mt-6">
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Créer mon premier projet
        </Link>
      </div>
    </div>
  )
}
