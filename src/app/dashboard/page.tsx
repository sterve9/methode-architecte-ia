import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Espace personnel</h1>
          <p className="mt-1 text-sm text-gray-600">
            Connecté en tant que : <span className="font-medium text-gray-900">{user.email}</span>
          </p>
        </div>

        {/* Navigation rapide */}
        <div className="space-y-3 pt-2">
          <Link
            href="/dashboard/projects"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
          >
            📁 Accéder à mes Projets
          </Link>

          <Link
            href="/dashboard/diffusion"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            ✍️ Générer un post depuis une preuve
          </Link>

          <Link
            href="/dashboard/mesures"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            📊 Consulter le journal des mesures
          </Link>

          <Link
            href="/p"
            target="_blank"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            🌟 Voir mon Portfolio Public (/p) ↗
          </Link>
        </div>

        {/* Déconnexion */}
        <div className="border-t border-gray-100 pt-4">
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
