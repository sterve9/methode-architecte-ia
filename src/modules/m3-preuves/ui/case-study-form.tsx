'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { updateProof } from '../actions/update-proof'
import { updateProofStatus } from '../actions/update-proof-status'
import type { PublicProof } from '../types'

/**
 * Formulaire d'édition d'une étude de cas (DT-S25-02).
 *
 * Deux gestes distincts, volontairement :
 * - « Enregistrer » → updateProof : écrit les champs, ne touche pas au statut.
 * - « Publier » → updateProofStatus : seul point d'écriture du statut et seul
 *   émetteur de CT-11. En cas de refus, on AFFICHE le motif qu'il renvoie —
 *   c'est la sortie de getPublicationBlockingReason, on ne la recalcule pas
 *   côté client, sous peine de voir les deux messages diverger un jour.
 *
 * Le rappel « il manque … » affiché en permanence est calculé côté serveur
 * par la page, à partir de la même fonction de domaine.
 */

interface CaseStudyFormProps {
  proof: PublicProof
  /** Libellés des champs manquants, calculés par la page (source unique). */
  missingLabels: string[]
}

type FormState = {
  title: string
  metier: string
  probleme: string
  solution: string
  resultat: string
  summary: string
  image_url: string
  video_url: string
}

const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.3rem',
  fontWeight: 'bold',
  fontSize: '0.85rem',
}

const HINT_STYLE: React.CSSProperties = {
  margin: '0.2rem 0 0 0',
  fontSize: '0.75rem',
  color: '#666',
}

export function CaseStudyForm({ proof, missingLabels }: CaseStudyFormProps) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [isPublishing, startPublishing] = useTransition()

  const [form, setForm] = useState<FormState>({
    title: proof.title,
    metier: proof.metier ?? '',
    probleme: proof.probleme ?? '',
    solution: proof.solution ?? '',
    resultat: proof.resultat ?? '',
    summary: proof.summary,
    image_url: proof.image_url ?? '',
    video_url: proof.video_url ?? '',
  })

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isBusy = isSaving || isPublishing
  const isPublished = proof.status === 'publié'

  const set = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
    setSuccessMessage(null)
  }

  /** Enregistre les champs. Renvoie false si l'écriture a échoué. */
  const save = async (): Promise<boolean> => {
    const result = await updateProof(proof.id, {
      title: form.title,
      metier: form.metier,
      probleme: form.probleme,
      solution: form.solution,
      resultat: form.resultat,
      summary: form.summary,
      image_url: form.image_url,
      video_url: form.video_url,
    })

    if (!result.success) {
      setErrorMessage(result.error ?? "Échec de l'enregistrement.")
      return false
    }

    return true
  }

  const handleSave = () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    startSaving(async () => {
      if (!(await save())) return

      setSuccessMessage('Modifications enregistrées.')
      router.refresh()
    })
  }

  /**
   * Publier enregistre d'abord : sinon on publierait l'état précédent, et le
   * verrou de complétude se prononcerait sur des valeurs déjà périmées.
   */
  const handlePublish = () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    startPublishing(async () => {
      if (!(await save())) return

      const result = await updateProofStatus(proof.id, 'publié')

      if (!result.success) {
        setErrorMessage(result.error ?? 'Échec de la publication.')
        router.refresh()
        return
      }

      setSuccessMessage('Étude de cas publiée.')
      router.refresh()
    })
  }

  return (
    <div>
      {missingLabels.length > 0 && (
        <div
          style={{
            background: '#fff8e1',
            border: '1px solid #ffe082',
            color: '#7a5c00',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
          }}
        >
          <strong>Pas encore publiable.</strong> Il manque : {missingLabels.join(', ')}.
          <br />
          Un brouillon incomplet est autorisé ; c&apos;est la publication qui
          exige une étude de cas complète.
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            color: '#c62828',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            background: '#e8f5e9',
            border: '1px solid #c8e6c9',
            color: '#2e7d32',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
          }}
        >
          {successMessage}
          {isPublished && (
            <>
              {' '}
              <Link href={`/p/${proof.slug}`} target="_blank" rel="noopener noreferrer">
                Voir /p/{proof.slug} ↗
              </Link>
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="title" style={LABEL_STYLE}>
          Titre du cas
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={set('title')}
          style={FIELD_STYLE}
        />
        <p style={HINT_STYLE}>Ce que le client a obtenu, pas le nom du livrable.</p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="metier" style={LABEL_STYLE}>
          Métier / cible
        </label>
        <input
          id="metier"
          type="text"
          value={form.metier}
          onChange={set('metier')}
          placeholder="Ex : Gestion de réseaux sociaux"
          style={FIELD_STYLE}
        />
        <p style={HINT_STYLE}>Pour qui. Le visiteur doit s&apos;y reconnaître.</p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="probleme" style={LABEL_STYLE}>
          Le problème
        </label>
        <textarea
          id="probleme"
          rows={4}
          value={form.probleme}
          onChange={set('probleme')}
          placeholder="Dans les mots du client, pas dans les tiens."
          style={FIELD_STYLE}
        />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="solution" style={LABEL_STYLE}>
          Ce que j&apos;ai construit
        </label>
        <textarea
          id="solution"
          rows={4}
          value={form.solution}
          onChange={set('solution')}
          placeholder="Le système, en clair. Pas les étapes de méthode."
          style={FIELD_STYLE}
        />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="resultat" style={LABEL_STYLE}>
          Le résultat
        </label>
        <textarea
          id="resultat"
          rows={3}
          value={form.resultat}
          onChange={set('resultat')}
          placeholder="La transformation obtenue. Un chiffre si tu en as un."
          style={FIELD_STYLE}
        />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="summary" style={LABEL_STYLE}>
          Accroche courte
        </label>
        <textarea
          id="summary"
          rows={2}
          value={form.summary}
          onChange={set('summary')}
          style={FIELD_STYLE}
        />
        <p style={HINT_STYLE}>
          Affichée sur les cartes de la vitrine et dans les aperçus de partage.
        </p>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label htmlFor="video_url" style={LABEL_STYLE}>
          Vidéo de démonstration (optionnel)
        </label>
        <input
          id="video_url"
          type="url"
          value={form.video_url}
          onChange={set('video_url')}
          placeholder="https://www.youtube.com/watch?v=..."
          style={FIELD_STYLE}
        />
        <p style={HINT_STYLE}>
          YouTube uniquement. Toute autre URL est ignorée à l&apos;affichage.
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label htmlFor="image_url" style={LABEL_STYLE}>
          Image de preuve (optionnel)
        </label>
        <input
          id="image_url"
          type="url"
          value={form.image_url}
          onChange={set('image_url')}
          placeholder="https://raw.githubusercontent.com/..."
          style={FIELD_STYLE}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          style={{
            padding: '0.5rem 1rem',
            background: '#eee',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: isBusy ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>

        <button
          type="button"
          onClick={handlePublish}
          disabled={isBusy}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isBusy ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {isPublishing
            ? 'Publication…'
            : isPublished
              ? 'Enregistrer et republier'
              : 'Publier'}
        </button>

        {isPublished && (
          <Link
            href={`/p/${proof.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.85rem' }}
          >
            Voir la page publique ↗
          </Link>
        )}
      </div>
    </div>
  )
}
