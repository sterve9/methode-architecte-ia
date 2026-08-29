'use client'

import { useState, useTransition } from 'react'

import { generatePostDraft } from '../actions/generate-post-draft'
import { CHANNEL_LABELS, X_MAX_LENGTH, type DiffusionChannel } from '../types'

interface GeneratePostButtonProps {
  proofId: string
  proofTitle: string
}

/** Zone de texte éditable avec son propre bouton Copier. */
function CopyableBlock({
  label,
  hint,
  value,
  rows,
  onChange,
  isOverLimit,
}: {
  label: string
  hint?: string
  value: string
  rows: number
  onChange: (next: string) => void
  isOverLimit?: boolean
}) {
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      setCopyError(false)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      setCopyError(true)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {hint && <span className="ml-2 text-xs text-slate-500">{hint}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
        >
          {isCopied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="block w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="flex justify-between text-xs">
        <span className={isOverLimit ? 'font-semibold text-red-600' : 'text-slate-500'}>
          {value.length} caractères
          {isOverLimit !== undefined && ` / ${X_MAX_LENGTH}`}
        </span>
        {copyError && (
          <span className="text-red-600">
            Copie impossible — sélectionne le texte à la main.
          </span>
        )}
      </div>
    </div>
  )
}

export function GeneratePostButton({ proofId, proofTitle }: GeneratePostButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [activeChannel, setActiveChannel] = useState<DiffusionChannel | null>(null)
  const [post, setPost] = useState('')
  const [firstComment, setFirstComment] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleGenerate = (channel: DiffusionChannel) => {
    setActiveChannel(channel)
    setErrorMessage(null)
    setPost('')
    setFirstComment(null)

    startTransition(async () => {
      const result = await generatePostDraft(proofId, channel)

      if (!result.success || !result.draft) {
        setErrorMessage(result.error ?? 'Échec de la génération.')
        return
      }

      setPost(result.draft.post)
      setFirstComment(result.draft.firstComment)
    })
  }

  const closeModal = () => {
    setActiveChannel(null)
    setPost('')
    setFirstComment(null)
    setErrorMessage(null)
  }

  return (
    <>
      <div className="flex gap-2">
        {(['linkedin', 'x'] as DiffusionChannel[]).map((channel) => (
          <button
            key={channel}
            onClick={() => handleGenerate(channel)}
            disabled={isPending}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending && activeChannel === channel
              ? 'Génération…'
              : `Post ${CHANNEL_LABELS[channel]}`}
          </button>
        ))}
      </div>

      {activeChannel && (isPending || post || errorMessage) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="my-8 w-full max-w-2xl space-y-5 rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Brouillon {CHANNEL_LABELS[activeChannel]}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{proofTitle}</p>
            </div>

            {isPending && (
              <p className="py-8 text-center text-sm text-slate-500">Rédaction en cours…</p>
            )}

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            {post && (
              <>
                <CopyableBlock
                  label={firstComment ? '1. Le post' : 'Le post'}
                  hint={firstComment ? 'sans lien, pour la portée' : undefined}
                  value={post}
                  rows={14}
                  onChange={setPost}
                  isOverLimit={
                    activeChannel === 'x' ? post.length > X_MAX_LENGTH : undefined
                  }
                />

                {firstComment && (
                  <CopyableBlock
                    label="2. Le premier commentaire"
                    hint="à poster juste après, il contient le lien"
                    value={firstComment}
                    rows={3}
                    onChange={setFirstComment}
                  />
                )}

                <div className="flex justify-end border-t border-slate-100 pt-3">
                  <button
                    onClick={closeModal}
                    className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
