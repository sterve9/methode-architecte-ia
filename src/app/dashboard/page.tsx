import { redirect } from 'next/navigation'

import { createClient } from '@/src/lib/supabase/server'

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
      </div>
    </div>
  )
}
