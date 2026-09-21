import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import {
  CASE_STUDY_FIELD_LABELS,
  getMissingCaseStudyFields,
} from '@/modules/m3-preuves/domain/proof-rules'
import { getProofById } from '@/modules/m3-preuves/queries/get-proof-by-id'
import { CaseStudyForm } from '@/modules/m3-preuves/ui/case-study-form'

/**
 * Écran d'édition d'une étude de cas (DT-S25-02).
 *
 * Route : /dashboard/proofs/[id]
 *
 * Remplace le flux du Lot 4, où une preuve était créée puis publiée dans la
 * foulée sans jamais pouvoir être relue ni corrigée. C'est ici qu'on rédige
 * le cas ; la publication reste un second geste, explicite.
 *
 * Sécurité : vérification de session faite ici explicitement, en défense en
 * profondeur, comme les autres pages du dashboard (DT-Lot5-07). Un brouillon
 * n'est de toute façon lisible qu'en session `authenticated` (aucune policy
 * `anon` ne le couvre).
 */
export default async function EditProofPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const proof = await getProofById(id)

  if (!proof) {
    notFound()
  }

  // Même fonction de domaine que le verrou serveur : le rappel affiché et le
  // refus de publier ne peuvent pas diverger.
  const missingLabels = getMissingCaseStudyFields(proof).map(
    (field) => CASE_STUDY_FIELD_LABELS[field]
  )

  const statusColors: Record<string, { background: string; color: string }> = {
    brouillon: { background: '#fff3e0', color: '#e65100' },
    publié: { background: '#e8f5e9', color: '#2e7d32' },
    archivé: { background: '#eceff1', color: '#455a64' },
  }
  const statusColor = statusColors[proof.status] ?? statusColors.archivé

  return (
    <main style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard">← Retour au dashboard</Link>
      </nav>

      <header style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ margin: 0 }}>Étude de cas</h1>
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 500,
              ...statusColor,
            }}
          >
            {proof.status}
          </span>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.85rem' }}>
          Adresse publique : <code>/p/{proof.slug}</code>
        </p>
      </header>

      <CaseStudyForm proof={proof} missingLabels={missingLabels} />
    </main>
  )
}
