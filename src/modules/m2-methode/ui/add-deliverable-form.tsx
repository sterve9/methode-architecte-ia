'use client'

import { useState, useTransition } from 'react'
import { createDeliverable } from '../actions/create-deliverable'

interface AddDeliverableFormProps {
  stepId: string
}

export function AddDeliverableForm({ stepId }: AddDeliverableFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.append('step_id', stepId)

    startTransition(async () => {
      const result = await createDeliverable(formData)
      if (result.success) {
        setIsOpen(false)
      } else {
        setErrorMessage(result.error || 'Erreur lors de la création du livrable.')
      }
    })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          marginTop: '0.5rem',
          padding: '0.2rem 0.6rem',
          fontSize: '0.8rem',
          background: 'none',
          border: '1px dashed #0070f3',
          color: '#0070f3',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        + Ajouter un livrable (URL)
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '0.75rem',
        padding: '0.75rem',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        background: '#ffffff',
      }}
    >
      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem' }}>Nouveau Livrable</h4>

      <div style={{ marginBottom: '0.5rem' }}>
        <input
          type="text"
          name="title"
          placeholder="Titre du livrable (ex: Figma, Repo GitHub...)"
          required
          style={{
            width: '100%',
            padding: '0.3rem 0.5rem',
            fontSize: '0.85rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <input
          type="url"
          name="url"
          placeholder="https://..."
          required
          style={{
            width: '100%',
            padding: '0.3rem 0.5rem',
            fontSize: '0.85rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <input
          type="text"
          name="description"
          placeholder="Description ou notes (optionnel)"
          style={{
            width: '100%',
            padding: '0.3rem 0.5rem',
            fontSize: '0.85rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {errorMessage && (
        <div style={{ color: '#d32f2f', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          disabled={isPending}
          style={{
            padding: '0.25rem 0.6rem',
            fontSize: '0.8rem',
            background: '#eee',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '0.25rem 0.6rem',
            fontSize: '0.8rem',
            background: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
