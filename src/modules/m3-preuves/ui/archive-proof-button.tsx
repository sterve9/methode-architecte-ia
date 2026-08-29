'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { updateProofStatus } from '../actions/update-proof-status'

interface ArchiveProofButtonProps {
  proofId: string
  proofTitle: string
}

/**
 * Retire une preuve de la vitrine publique (statut `archivé`).
 *
 * Comble un manque du Lot 4 : jusqu'ici aucune interface n'appelait
 * updateProofStatus avec 'archivé', donc une preuve publiée le restait
 * définitivement (voir DT-Lot5-05).
 */
export function ArchiveProofButton({ proofId, proofTitle }: ArchiveProofButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isConfirming, setIsConfirming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleArchive = () => {
    setErrorMessage(null)

    startTransition(async () => {
      const result = await updateProofStatus(proofId, 'archivé')

      if (!result.success) {
        setErrorMessage(result.error ?? "Échec de l'archivage.")
        return
      }

      setIsConfirming(false)
      router.refresh()
    })
  }

  if (!isConfirming) {
    return (
      <button
        onClick={() => setIsConfirming(true)}
        className="text-xs text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
      >
        Retirer de la vitrine
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600">
          Retirer « {proofTitle} » de la vitrine publique ?
        </span>
        <button
          onClick={handleArchive}
          disabled={isPending}
          className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {isPending ? 'Archivage…' : 'Confirmer'}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isPending}
          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
        >
          Annuler
        </button>
      </div>

      {errorMessage && <span className="text-xs text-red-600">{errorMessage}</span>}
    </div>
  )
}
