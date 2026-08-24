import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProofBySlug } from '@/modules/m3-preuves/queries/get-proof-by-slug'

export const revalidate = 60 // Revalidation ISR toutes les 60 secondes

interface PublicProofPageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicProofPage({ params }: PublicProofPageProps) {
  const { slug } = await params
  const proof = await getProofBySlug(slug)

  if (!proof) {
    notFound()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Navigation retour */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/p"
            style={{
              fontSize: '0.85rem',
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            ← Retour au portfolio
          </Link>
        </div>

        {/* Carte Récit de Compétence */}
        <article
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Méta en-tête */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#0284c7',
                background: '#f0f9ff',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
              }}
            >
              {proof.format}
            </span>
            {proof.published_at && (
              <time style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Publié le {new Date(proof.published_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            )}
          </div>

          {/* Titre du récit */}
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', lineHeight: '1.25', margin: '0 0 1.25rem' }}>
            {proof.title}
          </h1>

          {/* Résumé / Valeur apportée */}
          <div
            style={{
              background: '#f8fafc',
              borderLeft: '4px solid #0070f3',
              padding: '1rem 1.25rem',
              borderRadius: '0 8px 8px 0',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0070f3', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>
              Résumé & Valeur Proposée
            </h3>
            <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              {proof.summary}
            </p>
          </div>

          {/* Contexte & Méthodologie (si présent) */}
          {proof.context && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem' }}>
                Contexte & Méthodologie
              </h2>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line', margin: 0 }}>
                {proof.context}
              </p>
            </div>
          )}

          {/* Sceau de Certification */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🛡️</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#0f172a' }}>
                  Méthode Architecte IA
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Livrable vérifié et certifié
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                color: '#166534',
                background: '#f0fdf4',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid #bbf7d0',
                fontWeight: '600',
              }}
            >
              Statut : Publié
            </span>
          </div>
        </article>
      </div>
    </main>
  )
}
