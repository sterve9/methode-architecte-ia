import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { resolveSiteUrl } from '@/lib/site-url'
import { getProofBySlug } from '@/modules/m3-preuves/queries/get-proof-by-slug'

export const revalidate = 60 // Revalidation ISR toutes les 60 secondes

interface PublicProofPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PublicProofPageProps): Promise<Metadata> {
  const { slug } = await params
  const proof = await getProofBySlug(slug)

  if (!proof) {
    return { title: 'Preuve introuvable' }
  }

  return {
    title: proof.title,
    description: proof.summary,
    openGraph: {
      title: proof.title,
      description: proof.summary,
      url: `${resolveSiteUrl()}/p/${proof.slug}`,
      type: 'article',
      images: proof.image_url ? [{ url: proof.image_url }] : undefined,
    },
    twitter: {
      card: proof.image_url ? 'summary_large_image' : 'summary',
      title: proof.title,
      description: proof.summary,
      images: proof.image_url ? [proof.image_url] : undefined,
    },
  }
}

export default async function PublicProofPage({ params }: PublicProofPageProps) {
  const { slug } = await params
  const proof = await getProofBySlug(slug)

  if (!proof) {
    notFound()
  }

  const pageUrl = `${resolveSiteUrl()}/p/${proof.slug}`
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
  const xShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(proof.title)}`

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/p"
          className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
        >
          ← Retour au portfolio
        </Link>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 sm:p-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                {proof.format}
              </span>
              {proof.published_at && (
                <time className="text-xs text-slate-400">
                  Publié le{' '}
                  {new Date(proof.published_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              )}
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              {proof.title}
            </h1>

            <p className="mt-6 border-l-4 border-blue-600 pl-5 text-xl font-medium leading-snug text-slate-800 sm:text-2xl">
              {proof.summary}
            </p>
          </div>

          {proof.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proof.image_url}
              alt={`Capture du système — ${proof.title}`}
              className="w-full border-y border-slate-200 object-cover"
              loading="lazy"
            />
          )}

          <div className="p-6 sm:p-10">
            {proof.context && (
              <div className="mb-8">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-900">
                  Contexte & Méthodologie
                </h2>
                <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-slate-600">
                  {proof.context}
                </p>
              </div>
            )}

            {proof.deliverable_url && (
              <a
                href={proof.deliverable_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Voir le code source ↗
              </a>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <div>
                  <strong className="block text-sm text-slate-900">
                    Méthode Architecte IA
                  </strong>
                  <span className="text-xs text-slate-500">
                    Livrable vérifié et certifié
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={linkedInShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Partager sur LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-sky-300 hover:text-sky-700"
                >
                  in
                </a>
                <a
                  href={xShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Partager sur X"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900"
                >
                  𝕏
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
