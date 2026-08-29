/**
 * M5 Instrumentation : enregistrer un événement clé dans le journal `events`.
 *
 * Récepteur des contrats CT-04 (M1 → M5), CT-10 (M2 → M5) et CT-11 (M3 → M5).
 * C'est le SEUL point d'écriture de la table `events` : aucun module ne
 * l'écrit directement, conformément à CA-06.
 *
 * ── Pourquoi ce fichier ne porte PAS la directive 'use server' ──
 * Le dossier `actions/` réunit par convention les écritures du module, mais
 * recordEvent() n'est pas une Server Action : elle n'est jamais appelée depuis
 * le navigateur. Elle est consommée par les Server Actions des modules
 * émetteurs, côté serveur uniquement. Ajouter 'use server' l'exposerait comme
 * un point d'entrée réseau — c'est-à-dire offrirait un moyen de forger des
 * événements arbitraires et de fausser la mesure. Voir DT-Lot5-09.
 *
 * ── Pourquoi elle ne lève jamais ──
 * L'instrumentation observe la chaîne de valeur, elle ne la commande pas.
 * Un journal indisponible ne doit pas empêcher de créer un projet ou de
 * publier une preuve. Toute erreur est donc journalisée et retournée, jamais
 * propagée : c'est à l'appelant de décider, et aucun appelant ne doit échouer
 * pour cette raison.
 */

import { createClient } from '@/lib/supabase/server'
import { sourceTypeForEvent } from '../domain/event-rules'
import type { RecordEventInput, RecordEventResult } from '../types'

export async function recordEvent({
  type,
  sourceId,
  projectId,
}: RecordEventInput): Promise<RecordEventResult> {
  try {
    const sourceType = sourceTypeForEvent(type)

    const supabase = await createClient()

    const { error } = await supabase.from('events').insert({
      type,
      source_type: sourceType,
      source_id: sourceId,
      project_id: projectId,
    })

    if (error) {
      console.error(
        `[M5] Échec d'enregistrement de l'événement '${type}' (source ${sourceId}) :`,
        error
      )
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error(`[M5] Échec d'enregistrement de l'événement '${type}' :`, message)
    return { success: false, error: message }
  }
}
