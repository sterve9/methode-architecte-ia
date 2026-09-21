import Link from 'next/link'
import type { Metadata } from 'next'

import { CONTACT_LINKS, SOCIAL_LINKS, activeLinks } from '@/lib/contact'
import { getPublicProofs } from '@/modules/m3-preuves/queries/get-public-proofs'

export const revalidate = 60 // Revalidation ISR toutes les 60 secondes

/**
 * Vitrine publique (DT-S25-02).
 *
 * Ce que cette page ne dit JAMAIS : comment le travail a été produit. Pas de
 * méthode, pas de phases, pas de livrables, pas de vocabulaire d'architecte.
 * Un visiteur vient chercher son propre problème, résolu pour quelqu'un comme
 * lui. Les champs `format` et `context`, dépréciés, ne sont pas lus ici.
 *
 * `title.absolute` neutralise le template du layout racine, qui suffixe
 * « — Méthode Architecte IA ». Ce suffixe reste en vigueur côté dashboard.
 */
export const metadata: Metadata = {
  title: { absolute: 'Sterve — Systèmes IA & automatisation' },
  description:
    "J'automatise le travail répétitif des indépendants et petites entreprises : prospection, relances, suivi client, contenu. Chaque système est livré, mesuré et prouvé.",
}

const TRUST_ITEMS = [
  { icon: '✅', label: 'Systèmes réels livrés, pas des maquettes' },
  { icon: '📊', label: 'Résultats mesurés sur chaque projet' },
  { icon: '⚡', label: 'Livraison rapide, un système à la fois' },
]

const SERVICES = [
  {
    title: 'Systèmes de prospection',
    description: 'Trouver et prioriser vos prospects automatiquement',
  },
  {
    title: 'Relances & suivi client',
    description: 'Des relances au bon moment, sans y penser',
  },
  {
    title: 'Automatisations sur mesure',
    description: 'Un besoin répétitif ? Je conçois le système qui le fait tourner',
  },
]

export default async function PublicPortfolioPage() {
  const proofs = await getPublicProofs()

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* 1. HERO ------------------------------------------------------- */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-accent-soft to-white px-5 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent sm:text-sm">
            IA Automation Specialist · Architecte IA
          </p>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Je construis des systèmes IA qui font gagner des heures aux
            indépendants et petites entreprises.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            J&apos;automatise le travail répétitif — prospection, relances, suivi
            client, contenu — pour que vous vous concentriez sur votre métier.
            Chaque système est livré, mesuré et prouvé.
          </p>

          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="rounded-full bg-accent px-7 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Discutons de votre projet
            </a>
            <a
              href="#cas"
              className="rounded-full border border-slate-300 px-7 py-3.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
            >
              Voir les cas concrets
            </a>
          </div>
        </div>
      </section>

      {/* 2. BANDE DE CONFIANCE ----------------------------------------- */}
      <section className="border-b border-slate-100 bg-slate-50 px-5 py-6">
        <ul className="mx-auto flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-center gap-2 text-sm font-medium text-slate-700"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      {/* 3. ÉTUDES DE CAS ---------------------------------------------- */}
      <section id="cas" className="scroll-mt-8 px-5 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Des problèmes réels, résolus et mesurés
          </h2>

          {proofs.length === 0 ? (
            <p className="mx-auto mt-10 max-w-lg rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              Les premières études de cas arrivent. En attendant, parlons
              directement de votre besoin —{' '}
              <a href="#contact" className="font-semibold text-accent hover:underline">
                écrivez-moi
              </a>
              .
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {proofs.map((proof) => (
                <article
                  key={proof.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {proof.image_url && (
                    <Link href={`/p/${proof.slug}`} aria-hidden="true" tabIndex={-1}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proof.image_url}
                        alt=""
                        className="h-44 w-full border-b border-slate-100 object-cover"
                        loading="lazy"
                      />
                    </Link>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    {proof.metier && (
                      <p className="text-xs font-bold uppercase tracking-wider text-accent">
                        {proof.metier}
                      </p>
                    )}

                    <h3 className="mt-2 text-lg font-bold leading-snug">
                      <Link href={`/p/${proof.slug}`} className="hover:underline">
                        {proof.title}
                      </Link>
                    </h3>

                    {proof.resultat && (
                      <p className="mt-3 rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-2.5 text-sm font-semibold text-slate-800">
                        {proof.resultat}
                      </p>
                    )}

                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {proof.summary}
                    </p>

                    <Link
                      href={`/p/${proof.slug}`}
                      className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-hover"
                    >
                      Lire l&apos;étude de cas →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. SERVICES ---------------------------------------------------- */}
      <section className="border-y border-slate-100 bg-slate-50 px-5 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Ce que je peux automatiser pour vous
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-base font-bold">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. À PROPOS ---------------------------------------------------- */}
      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">À propos</h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600">
            Je suis Sterve, spécialiste en automatisation IA. Je conçois des
            systèmes concrets qui suppriment le travail répétitif des
            indépendants et petites structures — pour qu&apos;ils récupèrent du
            temps et arrêtent de perdre des clients. Je pars d&apos;un problème
            réel, je construis, je livre, je mesure. Chaque cas est une preuve,
            pas une promesse.
          </p>
        </div>
      </section>

      {/* 6. CONTACT ----------------------------------------------------- */}
      <section id="contact" className="scroll-mt-8 px-5 pb-16 sm:pb-20">
        <div className="mx-auto w-full max-w-3xl rounded-3xl bg-slate-900 px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Discutons de votre projet
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Décrivez-moi la tâche qui vous prend le plus de temps. Je vous dis
            si elle est automatisable, et comment.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            {/*
              Les canaux viennent de src/lib/contact.ts. Un canal encore fermé
              y vaut `null` et n'est tout simplement pas rendu : pas de lien
              mort sur une page qui invite à écrire.
            */}
            {activeLinks(CONTACT_LINKS).map((link, index) => {
              // Un mailto reste dans le contexte courant ; un profil externe
              // s'ouvre à côté, pour ne pas faire perdre la page au visiteur.
              const isExternal = link.href.startsWith('http')

              return (
              <a
                key={link.label}
                href={link.href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={
                  index === 0
                    ? 'rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover'
                    : 'rounded-full border border-slate-600 px-7 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white hover:text-white'
                }
              >
                {link.label}
              </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER ------------------------------------------------------ */}
      <footer className="border-t border-slate-100 px-5 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm font-medium text-slate-500">
            Systèmes livrés, mesurés, prouvés
          </p>

          <div className="flex items-center gap-5 text-xs text-slate-400">
            {activeLinks(SOCIAL_LINKS).map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-700"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
