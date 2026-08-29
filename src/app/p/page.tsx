import Link from 'next/link'
import type { Metadata } from 'next'

import { getPublicProofs } from '@/modules/m3-preuves/queries/get-public-proofs'

export const revalidate = 60 // Revalidation ISR toutes les 60 secondes

export const metadata: Metadata = {
  title: 'Portfolio',
  description:
    "Récits de compétences, livrables techniques et cas d'usage conçus selon la Méthode Architecte IA.",
}

export default async function PublicPortfolioPage() {
  const proofs = await getPublicProofs()

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-10 text-center">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
            Portfolio d&apos;Architecture IA
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Récits de Compétences & Preuves
          </h1>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Démonstrateurs, livrables techniques et cas d&apos;usage conçus et validés
            selon la Méthode Architecte IA.
          </p>
        </header>

        {proofs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">
              Aucune preuve publique n&apos;a été publiée pour le moment.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {proofs.map((proof) => (
              <article
                key={proof.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {proof.image_url && (
                  <Link href={`/p/${proof.slug}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proof.image_url}
                      alt={proof.title}
                      className="h-48 w-full border-b border-slate-100 object-cover"
                      loading="lazy"
                    />
                  </Link>
                )}

                <div className="p-6">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                      {proof.format}
                    </span>
                    {proof.published_at && (
                      <time className="text-xs text-slate-400">
                        {new Date(proof.published_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    <Link href={`/p/${proof.slug}`} className="hover:underline">
                      {proof.title}
                    </Link>
                  </h2>

                  <p className="mt-2 line-clamp-3 text-[0.95rem] leading-relaxed text-slate-600">
                    {proof.summary}
                  </p>

                  <Link
                    href={`/p/${proof.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Lire le récit complet →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-slate-400">
          Méthode Architecte IA — Propulsé par Next.js & Supabase
        </footer>
      </div>
    </main>
  )
}
