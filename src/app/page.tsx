import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

/**
 * Page racine ("/").
 *
 * Aucune UI propre : redirige vers /dashboard si une session est active,
 * sinon vers /login. Route publique côté middleware (voir
 * src/lib/supabase/middleware.ts), la décision d'authentification est
 * donc prise ici.
 */
export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  redirect('/login')
}
