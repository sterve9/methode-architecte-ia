import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

import { resolveSiteUrl } from '@/lib/site-url'
import { buildYouTubeEmbedUrl } from '@/modules/m3-preuves/domain/youtube-embed'
import { getProofBySlug } from '@/modules/m3-preuves/queries/get-proof-by-slug'

export const revalidate = 60 // Revalidation ISR toutes les 60 secondes

interface PublicProofPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Fiche publique d'une étude de cas (DT-S25-02).
 *
 * Le récit suit l'ordre du client : le problème, ce qui a été construit, le
 * résultat, la preuve. Ni `format` ni `context` ne sont lus — ce sont des
 * champs dépréciés qui parlaient de méthode. Le bloc « Contexte &
 * Méthodologie » et le badge « vérifié et certifié » ont été retirés : le
 * second était une auto-attribution que rien ne garantissait.
 *
 * Témoignage : aucune donnée de témoignage n'existe en base. Aucun
 * emplacement n'est donc rendu — un témoignage inventé ou un cadre vide
 * valent moins que rien sur une page qui prétend prouver.
 */

export async function generateMetadata({
  params,
}: PublicProofPageProps): Promise<Metadata> {
  const { slug } = await params
  const proof = await getProofBySlug(slug)

  if (!proof) {
    return { title: { absolute: 'Page introuvable' } }
  }

  return {
    // absolute : le public ne porte jamais le suffixe du layout racine.
    title: { absolute: proof.title },
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

  const embedUrl = buildYouTubeEmbedUrl(proof.video_url)

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-16">
        <Link
          href="/p"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          ← Tous les cas
        </Link>

        {/* En-tête --------------------------------------------------- */}
        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            {proof.metier && (
              <span className="rounded-full border border-accent-border bg-accent-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
                {proof.metier}
              </span>
            )}
            {proof.published_at && (
              <time
                dateTime={proof.published_at}
                className="text-xs text-slate-400"
              >
                {new Date(proof.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {proof.title}
          </h1>

          <p className="mt-5 border-l-4 border-accent pl-5 text-lg font-medium leading-snug text-slate-700 sm:text-xl">
            {proof.summary}
          </p>
        </header>

        {proof.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proof.image_url}
            alt={`Le système en fonctionnement — ${proof.title}`}
            className="mt-10 w-full rounded-2xl border border-slate-200 object-cover"
            loading="lazy"
          />
        )}

        {/* Le récit --------------------------------------------------- */}
        <div className="mt-12 space-y-10">
          {proof.probleme && (
            <section>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Le problème
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                {proof.probleme}
              </p>
            </section>
          )}

          {proof.solution && (
            <section>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Ce que j&apos;ai construit
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">
                {proof.solution}
              </p>
            </section>
          )}

          {proof.resultat && (
            <section className="rounded-2xl bg-accent-soft p-6 sm:p-8">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Le résultat
              </h2>
              <p className="mt-3 whitespace-pre-line text-lg font-semibold leading-relaxed text-slate-800">
                {proof.resultat}
              </p>
            </section>
          )}
        </div>

        {/* La preuve -------------------------------------------------- */}
        {(embedUrl || proof.deliverable_url) && (
          <section className="mt-12">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Voir le système
            </h2>

            {embedUrl && (
              <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                <iframe
                  src={embedUrl}
                  title={`Démonstration — ${proof.title}`}
                  className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}

            {proof.deliverable_url && (
              <a
                href={proof.deliverable_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Voir le système ↗
              </a>
            )}
          </section>
        )}

        {/* CTA -------------------------------------------------------- */}
        <section className="mt-14 rounded-3xl bg-slate-900 px-6 py-10 text-center sm:px-10">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Un besoin similaire ?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Décrivez-moi la tâche qui vous prend le plus de temps. Je vous dis
            si elle est automatisable, et comment.
          </p>
          <Link
            href="/p#contact"
            className="mt-6 inline-flex rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Parlons-en →
          </Link>
        </section>
      </div>
    </main>
  )
}
