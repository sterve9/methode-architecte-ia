'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { createProof } from '../actions/create-proof'

interface CreateProofButtonProps {
  deliverableId: string
  deliverableTitle: string
  deliverableDescription?: string | null
}

/**
 * Transforme un livrable publié en BROUILLON d'étude de cas, puis ouvre
 * l'écran d'édition (DT-S25-02).
 *
 * Ce bouton publiait auparavant dans la foulée de la création. Ce n'est plus
 * possible, et ce n'est plus souhaitable : une preuve est désormais une étude
 * de cas (métier, problème, solution, résultat), et ces champs ne peuvent pas
 * être devinés depuis un livrable. La rédaction se fait sur /dashboard/proofs/[id],
 * la publication est un second geste explicite.
 *
 * Le champ « Format de preuve » et le champ « Contexte & Méthodologie » ont
 * disparu : vocabulaire méthode, déprécié et non exposé au public.
 */
export function CreateProofButton({
  deliverableId,
  deliverableTitle,
  deliverableDescription,
}: CreateProofButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCreate = () => {
    setErrorMessage(null)

    startTransition(async () => {
      const result = await createProof({
        deliverable_id: deliverableId,
        title: deliverableTitle,
        summary: deliverableDescription?.trim() || deliverableTitle,
        // `format` reste requis par le contrat CT-03, consommé par M4
        // Diffusion. Il n'est plus saisi ni affiché en public : une valeur
        // neutre unique vaut mieux qu'un choix imposé à l'utilisateur pour
        // un champ déprécié (DT-S25-02).
        format: 'Étude de cas',
      })

      if (!result.success || !result.proofId) {
        setErrorMessage(result.error || 'Échec de la création du brouillon.')
        return
      }

      router.push(`/dashboard/proofs/${result.proofId}`)
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={handleCreate}
        disabled={isPending}
        style={{
          padding: '0.15rem 0.5rem',
          fontSize: '0.75rem',
          borderRadius: '4px',
          border: '1px solid var(--accent)',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          cursor: isPending ? 'not-allowed' : 'pointer',
          fontWeight: '500',
        }}
      >
        {isPending ? 'Création…' : '🌟 Étude de cas'}
      </button>

      {errorMessage && (
        <span style={{ fontSize: '0.75rem', color: '#c62828' }}>{errorMessage}</span>
      )}
    </div>
  )
}
