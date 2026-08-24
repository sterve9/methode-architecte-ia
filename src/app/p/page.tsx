import Link from 'next/link'
import { getPublicProofs } from '@/modules/m3-preuves/queries/get-public-proofs'

export const revalidate = 60 // Revalidation ISR toutes les 60 secondes

export default async function PublicPortfolioPage() {
  const proofs = await getPublicProofs()

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '2rem 1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header Portfolio */}
        <header style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#0070f3',
              background: '#e6f0ff',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
            }}
          >
            Portfolio d'Architecture IA
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.75rem' }}>
            Récits de Compétences & Preuves
          </h1>
          <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Démonstrateurs, livrables techniques et cas d'usage conçus et validés selon la Méthode Architecte IA.
          </p>
        </header>

        {/* Liste des Preuves */}
        {proofs.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              padding: '3rem 1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Aucune preuve publique n'a été publiée pour le moment.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {proofs.map((proof) => (
              <article
                key={proof.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#0284c7',
                      background: '#f0f9ff',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    {proof.format}
                  </span>
                  {proof.published_at && (
                    <time style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(proof.published_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </time>
                  )}
                </div>

                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: '0.25rem 0 0.5rem' }}>
                  <Link
                    href={`/p/${proof.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {proof.title}
                  </Link>
                </h2>

                <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1rem' }}>
                  {proof.summary}
                </p>

                <div>
                  <Link
                    href={`/p/${proof.slug}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#0070f3',
                      textDecoration: 'none',
                    }}
                  >
                    Lire le récit complet →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer simple */}
        <footer style={{ marginTop: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
          Méthode Architecte IA — Propulsé par Next.js & Supabase
        </footer>
      </div>
    </main>
  )
}
