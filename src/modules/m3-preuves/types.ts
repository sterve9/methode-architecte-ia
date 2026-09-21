export type ProofStatus = 'brouillon' | 'publié' | 'archivé';

/**
 * Preuve publique = ÉTUDE DE CAS orientée client (DT-S25-02).
 *
 * Les 5 champs `metier` / `probleme` / `solution` / `resultat` / `video_url`
 * portent le cas lui-même : pour qui, quel problème, quoi construit, quel
 * résultat, quelle démonstration. Ils ne décrivent JAMAIS les étapes de la
 * méthode interne — celle-ci reste privée.
 *
 * Nullables en base (migration 20260921032542, option A) : un brouillon
 * incomplet est légitime. La complétude est une règle métier appliquée au
 * seul passage en `publié` (voir domain/proof-rules.ts), pas une contrainte
 * de table.
 *
 * `format` et `context` sont DÉPRÉCIÉS (DT-S25-02) : colonnes conservées, plus
 * destinées à l'exposition publique. Encore lus par le contrat CT-03 (M4).
 */
export interface PublicProof {
  id: string;
  deliverable_id: string;
  title: string;
  slug: string;
  /** Accroche courte : cartes de la vitrine + meta description. */
  summary: string;
  /** La cible / le métier, en langage client (ex. « Gestion de réseaux sociaux »). */
  metier: string | null;
  /** Le problème du client, dans ses mots. */
  probleme: string | null;
  /** Ce qui a été construit, en clair — pas les étapes de méthode. */
  solution: string | null;
  /** Le résultat / la transformation, chiffré quand la donnée existe. */
  resultat: string | null;
  /** URL YouTube de la démonstration. Recommandée, non bloquante. */
  video_url: string | null;
  image_url: string | null;
  /** @deprecated DT-S25-02 — vocabulaire méthode, plus exposé en public. */
  format: string;
  /** @deprecated DT-S25-02 — vocabulaire méthode, plus exposé en public. */
  context: string | null;
  status: ProofStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Création d'une preuve. Les champs de l'étude de cas sont optionnels : une
 * preuve naît en `brouillon`, et c'est la publication qui exige un cas complet.
 */
export interface CreateProofInput {
  deliverable_id: string;
  title: string;
  slug?: string;
  summary: string;
  metier?: string;
  probleme?: string;
  solution?: string;
  resultat?: string;
  video_url?: string;
  image_url?: string;
  /** @deprecated DT-S25-02 — conservé tant que CT-03 le consomme. */
  format: string;
  /** @deprecated DT-S25-02 — conservé tant que CT-03 le consomme. */
  context?: string;
}

/**
 * Édition d'une preuve existante (action updateProof).
 *
 * `status` y figure, mais updateProof ne l'écrit pas lui-même : il délègue à
 * updateProofStatus, qui reste le SEUL point d'écriture du statut et le seul
 * émetteur de l'événement CT-11. Dupliquer cette logique reviendrait à
 * compter deux fois la même preuve dans la cadence (journal append-only).
 */
export interface UpdateProofInput {
  title?: string;
  slug?: string;
  summary?: string;
  metier?: string;
  probleme?: string;
  solution?: string;
  resultat?: string;
  video_url?: string;
  image_url?: string;
  status?: ProofStatus;
  /** @deprecated DT-S25-02 — conservé tant que CT-03 le consomme. */
  format?: string;
  /** @deprecated DT-S25-02 — conservé tant que CT-03 le consomme. */
  context?: string;
}

/**
 * Sous-ensemble de l'étude de cas soumis à la règle de complétude.
 *
 * Volontairement structurel et non `PublicProof` : la règle doit pouvoir être
 * évaluée sur un état candidat (ligne en base + patch d'édition) avant
 * qu'aucune écriture n'ait eu lieu.
 */
export interface CaseStudyFields {
  metier?: string | null;
  probleme?: string | null;
  solution?: string | null;
  resultat?: string | null;
}

/**
 * Preuve publique enrichie du titre et de l'URL du livrable source.
 * Usage : fiche publique /p/[slug] (lien "Voir le code source").
 */
export interface PublicProofWithSource extends PublicProof {
  deliverable_title: string | null;
  deliverable_url: string | null;
}

/**
 * Charge utile du contrat CT-03 (C3 Preuves → C4 Diffusion).
 *
 * Émise par M3, consommée par M4 Diffusion : M4 ne lit jamais directement
 * la table public_proofs (contrainte CA-06 de 08.Architecture.md).
 *
 * `project_name` et `project_business_problem` ne sont récupérables qu'en
 * session authentifiée : les policies RLS anon ne donnent accès qu'aux
 * colonnes id/title/url de deliverables (voir DT-Lot4-02).
 *
 * DT-S25-02 : le contrat n'évolue PAS dans cette phase. Il continue de porter
 * `format` et `context`, qui existent toujours en base. Le basculer sur les
 * champs d'étude de cas est une décision de contrat à part entière (elle
 * change ce que M4 rédige), traitée hors de la phase « modèle de données ».
 */
export interface ProofDiffusionPayload {
  id: string;
  title: string;
  slug: string;
  format: string;
  summary: string;
  context: string | null;
  deliverable_url: string | null;
  project_name: string | null;
  project_business_problem: string | null;
}
