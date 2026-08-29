import Link from 'next/link'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { getPublicProofs } from '@/modules/m3-preuves/queries/get-public-proofs'
import { ArchiveProofButton } from '@/modules/m3-preuves/ui/archive-proof-button'
import { GeneratePostButton } from '@/modules/m4-diffusion/ui/generate-post-button'

/**
 * Page M4 Diffusion : générer un brouillon de post à partir d'une preuve publiée.
 *
 * Route : /dashboard/diffusion
 *
 * Sécurité : la vérification de session est faite ici explicitement. Elle ne
 * repose pas sur le proxy racine (voir la note "Protection des routes" dans
 * docs/technique/architecture.md).
 */
export default async function DiffusionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const proofs = await getPublicProofs()

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <nav>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Retour au dashboard
          </Link>
        </nav>

        <header>
          <h1 className="text-2xl font-bold text-gray-900">Diffusion</h1>
          <p className="mt-2 text-sm text-gray-600">
            Génère un brouillon de publication à partir d&apos;une preuve publiée.
            Le texte est à relire puis à copier-coller manuellement — rien
            n&apos;est publié automatiquement.
          </p>
        </header>

        {proofs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Aucune preuve publiée pour le moment. Publie d&apos;abord une preuve
            depuis un livrable pour pouvoir en tirer un post.
          </p>
        ) : (
          <ul className="space-y-4">
            {proofs.map((proof) => (
              <li
                key={proof.id}
                className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {proof.format}
                  </span>
                  <h2 className="mt-2 font-semibold text-gray-900">{proof.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {proof.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/p/${proof.slug}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Voir la preuve publique ↗
                    </Link>

                    <ArchiveProofButton proofId={proof.id} proofTitle={proof.title} />
                  </div>

                  <GeneratePostButton proofId={proof.id} proofTitle={proof.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
