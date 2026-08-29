import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes publiques : accessibles sans authentification.
// Toute route non listée ici sera considérée comme privée.
//
// ⚠️ `/p` (vitrine des preuves publiques) et son préfixe `/p/` (fiche
// `/p/[slug]`) sont la SEULE surface d'exposition publique du système
// (CA-05, contrat CT-09). Les retirer d'ici couperait instantanément
// l'accès anonyme à tout le portfolio. Voir DT-Lot5-07.
const PUBLIC_PATHS = ['/', '/login', '/p']
const PUBLIC_PREFIXES = ['/auth/', '/p/']

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true
  }
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT : ne pas écrire de code entre createServerClient et
  // supabase.auth.getUser(). Une erreur ici rendrait la session instable.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protection des routes privées : redirection vers /login si non authentifié.
  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
