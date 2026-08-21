'use client'

import { useState, useTransition } from 'react'
import { updateStepStatus } from '../actions/update-step-status'
import { canStepTransition } from '../domain/step-transitions'
import { MethodStepStatus } from '../types'

interface StepStatusButtonProps {
  stepId: string
  currentStatus: MethodStepStatus
}

export function StepStatusButton({ stepId, currentStatus }: StepStatusButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleStatusChange = (targetStatus: MethodStepStatus) => {
    setErrorMessage(null)
    startTransition(async () => {
      const result = await updateStepStatus(stepId, targetStatus)
      if (!result.success) {
        setErrorMessage(result.error || 'Erreur lors du changement de statut.')
      }
    })
  }

  // Ne rien afficher si l'état est terminal
  if (currentStatus === 'Terminée') {
    return null
  }

  const canStart = canStepTransition(currentStatus, 'En cours')
  const canComplete = canStepTransition(currentStatus, 'Terminée')
  const canReset = canStepTransition(currentStatus, 'À faire')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {canStart && (
          <button
            onClick={() => handleStatusChange('En cours')}
            disabled={isPending}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid #b78103',
              background: '#fff8e1',
              color: '#b78103',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'En cours...' : 'Démarrer'}
          </button>
        )}

        {canComplete && (
          <button
            onClick={() => handleStatusChange('Terminée')}
            disabled={isPending}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid #2e7d32',
              background: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 'bold',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'En cours...' : 'Terminer'}
          </button>
        )}

        {canReset && (
          <button
            onClick={() => handleStatusChange('À faire')}
            disabled={isPending}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.8rem',
              borderRadius: '4px',
              border: '1px solid #9e9e9e',
              background: '#f5f5f5',
              color: '#616161',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'En cours...' : 'Remettre À faire'}
          </button>
        )}
      </div>

      {errorMessage && (
        <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.2rem' }}>
          {errorMessage}
        </span>
      )}
    </div>
  )
}
