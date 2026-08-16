import { redirect } from 'next/navigation'

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
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Espace personnel
        </h1>
        <p className="text-center text-sm text-gray-700">
          Connecté en tant que : <span className="font-medium">{user.email}</span>
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  )
}
