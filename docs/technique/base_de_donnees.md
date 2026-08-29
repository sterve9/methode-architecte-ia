# Base de données — Schéma et conventions Supabase

Ce document décrit l'état actuel du schéma Postgres/Supabase et les
conventions à respecter pour toute nouvelle migration.

Public visé : moi-même dans 6 mois, ou toute personne devant ajouter
une table ou une policy sans casser l'existant.

---

## 1. Emplacement et convention de migration

- Dossier : `supabase/migrations/`
- Nommage : `YYYYMMDDHHMMSS_description_courte.sql` (horodatage + résumé)
- Chaque migration est **additive** par défaut : on ne réécrit pas
  l'historique, on ajoute une nouvelle migration (voir `decisions.md`,
  `DT-Lot2-01` pour un exemple de choix "validation applicative plutôt
  que contrainte DB").

---

## 2. Tables actuelles

| Table | Rôle | Migration d'origine |
|---|---|---|
| `projects` | Objet central (M1) | `20260816153643_create_projects_table.sql` |
| `method_versions` | Canevas de méthode versionné (M2) | `20260819120000_create_method_and_deliverables_tables.sql` |
| `method_version_steps` | Étapes du canevas, par version | idem |
| `method_steps` | Étapes clonées, instances par projet (M2) | idem |
| `deliverables` | Livrables rattachés à une étape (M2) | idem |
| `public_proofs` | Preuves publiques (M3) | `20260824091514_create_public_proofs_table.sql` |

Pas de table `events` à ce jour — c'est l'objet du Lot 5 (Instrumentation),
voir `11.Plan_Implementation.md` et `decisions.md` (`DT-Lot5-01`).

### `projects`

- `status` : enum `project_status` (`Idée`, `Cadré`, `En cours`, `En pause`,
  `Livré`, `Archivé`) — transitions définies dans `05.Cycle_de_Vie.md`.
- `archive_reason` : `TEXT NULL`, obligatoire à l'archivage mais validé
  **au niveau applicatif seulement**, pas en contrainte DB (`DT-Lot2-01`).
- `version_id` : référence la `method_versions` active à la création
  du projet (figée, immuable après coup).
- Pas de policy DELETE : suppression physique interdite par conception.

### `method_versions` / `method_version_steps` / `method_steps` / `deliverables`

- Une version de méthode est immuable une fois créée (`DT-Lot3-01`).
- `deliverables.url` : `TEXT NOT NULL` — un livrable est toujours un lien
  externe, jamais un fichier uploadé en MVP (`DT-Lot3-01`).
- Cycles de vie détaillés : `05.Cycle_de_Vie.md` §7-8, implémentés dans
  `m2-methode/domain/step-transitions.ts` et `deliverable-transitions.ts`.

### `public_proofs`

- `slug` : `TEXT UNIQUE` — identifiant public lisible (`/p/[slug]`).
- `status` : `CHECK IN ('brouillon', 'publié', 'archivé')`.
- `image_url` : `TEXT NULL`, ajoutée après coup pour l'Open Graph
  (`20260829020045_add_image_url_to_public_proofs.sql`).
- Une preuve référence un unique livrable source (`deliverable_id NOT NULL`) —
  cardinalité N livrables sources différée post-MVP (`DT-Lot4-01`).

---

## 3. RPC

| Fonction | Rôle | Migration |
|---|---|---|
| `create_project_with_steps` | Crée un projet + clone atomiquement les étapes de la version active, dans une seule transaction Postgres | `20260821120000_create_project_with_steps_rpc.sql` |

Raison de l'atomicité RPC plutôt qu'écritures séparées côté client :
`decisions.md` (`DT-Lot3-04`).

---

## 4. RLS (Row Level Security)

Toutes les tables ont RLS activé. Principe général : un utilisateur
authentifié ne voit/modifie que ses propres données (via `user_id = auth.uid()`
ou une jointure jusqu'à `projects.user_id`).

**Exception publique (accès `anon`)**, strictement scopée :
- `public_proofs` : lecture seule où `status = 'publié'`.
- `deliverables` : lecture des seules colonnes `id, title, url`, uniquement
  pour le livrable source d'une preuve publiée (jointure vers
  `public_proofs.status = 'publié'`).

Aucune autre table n'accorde de droit à `anon`. Détail de la stratégie
d'exposition publique : `decisions.md` (`DT-Lot4-02`).

---

## 5. Pour aller plus loin

- Vue technique de l'architecture applicative : `architecture.md`
- Le "pourquoi" de chaque choix de schéma : `decisions.md`
