'use client'

import { useState, useTransition } from 'react'
import { updateDeliverableStatus } from '../actions/update-deliverable-status'
import { Deliverable } from '../types'
import { CreateProofButton } from '@/modules/m3-preuves/ui/create-proof-button'

interface DeliverableItemProps {
  deliverable: Deliverable
}

export function DeliverableItem({ deliverable }: DeliverableItemProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isPublished = deliverable.status === 'Publié'
  const targetStatus = isPublished ? 'Brouillon' : 'Publié'

  const handleToggleStatus = () => {
    setErrorMessage(null)
    startTransition(async () => {
      const result = await updateDeliverableStatus(deliverable.id, targetStatus)
      if (!result.success) {
        setErrorMessage(result.error || 'Erreur lors de la modification du statut.')
      }
    })
  }

  return (
    <div
      style={{
        padding: '0.5rem 0.75rem',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        background: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '0.4rem',
      }}
    >
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong style={{ fontSize: '0.85rem' }}>{deliverable.title}</strong>
          <a
            href={deliverable.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              color: '#0070f3',
              textDecoration: 'underline',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '300px',
            }}
          >
            {deliverable.url} ↗
          </a>
        </div>
        {deliverable.description && (
          <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
            {deliverable.description}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <span
          style={{
            padding: '0.1rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: isPublished ? '#e8f5e9' : '#fff3e0',
            color: isPublished ? '#2e7d32' : '#e65100',
            border: isPublished ? '1px solid #c8e6c9' : '1px solid #ffe0b2',
          }}
        >
          {deliverable.status}
        </span>

        {isPublished && (
          <CreateProofButton
            deliverableId={deliverable.id}
            deliverableTitle={deliverable.title}
            deliverableDescription={deliverable.description}
          />
        )}

        <button
          onClick={handleToggleStatus}
          disabled={isPending}
          style={{
            padding: '0.15rem 0.5rem',
            fontSize: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: '#f9f9f9',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? '...' : isPublished ? 'Dépublier' : 'Publier'}
        </button>

        {errorMessage && (
          <span style={{ color: '#d32f2f', fontSize: '0.7rem' }}>{errorMessage}</span>
        )}
      </div>
    </div>
  )
}
