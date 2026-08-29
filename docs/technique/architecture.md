# Architecture technique — Vue d'implémentation

Ce document décrit **comment le code implémente** le découpage modulaire
décidé dans `08.Architecture.md` (racine du repo). Pour le **pourquoi**
du découpage M1-M7 et ses contrats métier, voir `08.Architecture.md` et
`decisions.md` (`DT-Lot0-02`).

Public visé : moi-même dans 6 mois, ou toute personne devant intervenir
sur le code sans avoir suivi les séances de méthode.

---

## 1. Stack

Next.js 16 (App Router) + React 19 + TypeScript + Supabase
(`@supabase/ssr`, Auth + Postgres) + Tailwind v4 + Vitest + Playwright.

Justification complète du choix : `decisions.md` (`DT-Lot0-01`).

⚠️ Next.js 16 casse des conventions connues (ex : `proxy.ts` remplace
`middleware.ts`, voir §4). Toujours vérifier `node_modules/next/dist/docs/`
avant d'écrire du code qui touche au routing ou au serveur.

---

## 2. Organisation du code source

```
src/
  app/            → routes Next.js (App Router), y compris les pages publiques
  lib/            → utilitaires transverses (client Supabase, etc.)
  modules/        → les 7 modules métier (voir §3)
proxy.ts          → racine du repo (contrainte Next.js 16, voir §4)
```

**Dette connue** : l'alias tsconfig `@/*` pointe vers `./*` au lieu de
`./src/*`, donc les imports internes utilisent la forme non standard
`@/src/lib/...`. Détail et plan de traitement : `decisions.md` (`DT-Lot1-03`).

---

## 3. Les modules (`src/modules/mX-nom/`)

Convention de dossier (normative, référencée depuis `08.Architecture.md` §6) :

| Sous-dossier | Contenu |
|---|---|
| `domain/` | règles métier pures, transitions d'état — aucun import Supabase/Next |
| `actions/` | Server Actions (`'use server'`) — écriture, validation, `revalidatePath` |
| `queries/` | lecture seule, fonctions async simples |
| `ui/` | composants React du module |
| `types.ts` | types TypeScript miroir des colonnes DB |

**État d'implémentation actuel :**

| Module | Dossier | État |
|---|---|---|
| M1 Projets | `m1-projets/` | Implémenté (domain, actions, queries) |
| M2 Méthode | `m2-methode/` | Implémenté (domain, actions, queries, ui) |
| M3 Preuves | `m3-preuves/` | Implémenté (domain, actions, queries, ui) |
| M4 Diffusion | `m4-diffusion/` | Implémenté en **diffusion assistée** (génération de brouillons de posts). La diffusion automatisée reste hors MVP (`DT-Lot5-04`) |
| M5 Mesures | `m5-mesures/` | Coquille (`.gitkeep`) — Lot 5, en attente |
| M6 Missions | `m6-missions/` | Coquille (`.gitkeep`) — hors MVP (`11.Plan_Implementation.md` §6) |
| M7 Consultation | `m7-consultation/` | Coquille (`.gitkeep`) — voir dette §5 |

**Patron Server Action** (voir `m3-preuves/actions/create-proof.ts` pour
un exemple complet) :
1. `createClient()` depuis `@/lib/supabase/server`
2. `supabase.auth.getUser()` — retour anticipé si non authentifié
3. Récupération des lignes nécessaires à la validation
4. Appel d'une fonction `domain/` pour valider la règle métier
5. Écriture (insert/update)
6. `revalidatePath(...)` sur les routes affectées
7. Retour d'un objet typé `{ success, error?, ... }` (jamais de throw)

---

## 4. Authentification et session

- Utilisateur unique, signup public désactivé (`decisions.md`, `DT-Lot1-01`).
- Rafraîchissement de session : `proxy.ts` (racine du repo) délègue à
  `src/lib/supabase/middleware.ts`. Convention Next.js 16 — pas de
  `middleware.ts` (`decisions.md`, `DT-Lot1-02`).

### ⚠️ Le proxy racine n'est pas appliqué

Mesuré en production, en anonyme : `/` redirige alors qu'il est déclaré public,
`/p` répond 200 alors qu'il ne l'est pas. `proxy.ts` est à la racine du dépôt
alors que le projet utilise `src/` — Next.js l'attend à `src/proxy.ts`.

**Conséquence pratique : toute page privée doit faire sa propre vérification
`auth.getUser()`.** C'est ce que font toutes les pages du dashboard. Ne jamais
supposer qu'une route est protégée par le proxy.

**Avant de corriger** : ajouter `/p` à `PUBLIC_PATHS` *d'abord*, sinon le
déplacement du fichier coupe l'accès anonyme à toute la vitrine publique.

Détail complet et report assumé : `decisions.md`, `DT-Lot5-06`.

---

## 5. Dette connue — frontière M3 / M7

Les routes publiques `src/app/p/page.tsx` et `src/app/p/[slug]/page.tsx`
importent aujourd'hui directement `m3-preuves/queries/...`, sans passer
par un module M7. Ceci viole la contrainte `CA-06` de `08.Architecture.md`
("aucun module n'accède directement aux données d'un autre module").

Cette entorse est documentée et son traitement (scaffold `m7-consultation/`
+ migration des routes `/p`) est planifié avec le Lot 5, une fois les
contrats manquants comblés (`decisions.md`, `DT-Lot5-01`).

---

## 6. Pour aller plus loin

- Schéma et conventions Supabase : `base_de_donnees.md`
- Exécution des tests : `tests.md`
- CI/CD et déploiement : `deploiement.md`
- Le "pourquoi" de chaque choix : `decisions.md`
