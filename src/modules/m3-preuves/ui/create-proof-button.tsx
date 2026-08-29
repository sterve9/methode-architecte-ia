'use client'

import { useState, useTransition } from 'react'
import { createProof } from '../actions/create-proof'
import { updateProofStatus } from '../actions/update-proof-status'

interface CreateProofButtonProps {
  deliverableId: string
  deliverableTitle: string
  deliverableDescription?: string | null
}

export function CreateProofButton({
  deliverableId,
  deliverableTitle,
  deliverableDescription,
}: CreateProofButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)

  const [title, setTitle] = useState(deliverableTitle)
  const [format, setFormat] = useState('Récit de compétence')
  const [summary, setSummary] = useState(deliverableDescription || '')
  const [context, setContext] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!title.trim() || !summary.trim()) {
      setErrorMessage('Le titre et le résumé sont obligatoires.')
      return
    }

    startTransition(async () => {
      const result = await createProof({
        deliverable_id: deliverableId,
        title: title.trim(),
        format: format.trim(),
        summary: summary.trim(),
        context: context.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
      })

      if (!result.success || !result.proofId) {
        setErrorMessage(result.error || 'Échec de la création de la preuve.')
        return
      }

      const publishResult = await updateProofStatus(result.proofId, 'publié')

      if (!publishResult.success) {
        setErrorMessage(publishResult.error || 'Preuve créée mais échec de la publication.')
        return
      }

      // Slug renvoyé par le serveur (pas de recalcul client)
      setPublishedSlug(result.slug || null)
      setIsOpen(false)
    })
  }

  if (publishedSlug) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
        <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Preuve publiée !</span>
        <a
          href={`/p/${publishedSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0070f3', textDecoration: 'underline' }}
        >
          Voir /p/{publishedSlug} ↗
        </a>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '0.15rem 0.5rem',
          fontSize: '0.75rem',
          borderRadius: '4px',
          border: '1px solid #0070f3',
          background: '#e6f0ff',
          color: '#0070f3',
          cursor: 'pointer',
          fontWeight: '500',
        }}
      >
        🌟 Preuve publique
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '1.5rem',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
              🌟 Transformer en Preuve Publique
            </h3>

            {errorMessage && (
              <div
                style={{
                  background: '#ffebee',
                  color: '#c62828',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '0.2rem',
                  }}
                >
                  Titre du Récit
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '0.2rem',
                  }}
                >
                  Format de preuve
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <option value="Récit de compétence">Récit de compétence</option>
                  <option value="Cas d'usage">Cas d&apos;usage</option>
                  <option value="Livrable technique">Livrable technique</option>
                  <option value="Démonstrateur AI">Démonstrateur AI</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '0.2rem',
                  }}
                >
                  Résumé / Valeur apportée
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '0.2rem',
                  }}
                >
                  Contexte & Méthodologie (Optionnel)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                  placeholder="Ex: Projet réalisé sous contrainte avec Next.js & Supabase..."
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    marginBottom: '0.2rem',
                  }}
                >
                  Image de preuve (Optionnel)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/..."
                  style={{
                    width: '100%',
                    padding: '0.4rem',
                    fontSize: '0.85rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#0070f3',
                    color: '#fff',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {isPending ? 'Publication en cours...' : 'Publier la preuve 🚀'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
