import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createProject } from '@/modules/m1-projets/actions/create-project'
import { createClient } from '@/lib/supabase/server'

/**
 * Page : formulaire de création d'un projet.
 *
 * - Server Component (aucun 'use client').
 * - Protégée par vérification de session (auth.getUser()) en défense en profondeur,
 *   en plus de la protection allowlist du proxy Lot 1.
 * - Le formulaire monte directement la Server Action createProject.
 * - Affiche un message d'erreur si le query param ?error=... est présent.
 *
 * Next.js 16 : searchParams est une Promise (breaking change).
 */
export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // 1. Vérification de session
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Récupération de l'éventuel message d'erreur
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Lien retour dashboard */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Retour au dashboard
          </Link>
        </div>

        {/* Carte formulaire */}
        <div className="space-y-6 rounded-lg bg-white p-8 shadow-md">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nouveau projet
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Un projet est une unité de travail concrète qui applique la méthode
              pour résoudre un problème réel.
            </p>
          </div>

          {/* Message d'erreur éventuel */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Formulaire */}
          <form action={createProject} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-900"
              >
                Nom du projet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={200}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex : Méthode Architecte IA"
              />
            </div>

            <div>
              <label
                htmlFor="business_problem"
                className="block text-sm font-medium text-gray-900"
              >
                Problème métier traité
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Décris le problème réel que ce projet vise à résoudre.
              </p>
              <textarea
                id="business_problem"
                name="business_problem"
                required
                rows={8}
                maxLength={5000}
                className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex : Produire régulièrement des preuves publiques de compétence pour attirer des missions naturellement."
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/dashboard"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Annuler
              </Link>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Créer le projet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
