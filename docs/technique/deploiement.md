# Déploiement — Fonctionnement runtime

Ce document explique ce qui se passe **techniquement** quand du code est poussé sur `main` ou proposé en Pull Request.

Public visé : moi-même dans 6 mois, ou toute personne ayant besoin de comprendre / déboguer le pipeline.

Pour le **pourquoi** des choix (Vercel, GitHub Actions, etc.), voir [`decisions.md`](./decisions.md).

---

## 1. Vue d'ensemble
Développeur local
│
│ git push origin main
▼
┌─────────────────────────────────────────┐
│ GitHub │
│ │
│ ┌──────────────────┐ │
│ │ GitHub Actions │ │
│ │ workflow "CI" │ │
│ │ - lint │ │
│ │ - build │ │
│ │ - test (Vitest) │ │
│ └──────────────────┘ │
│ │
│ │ webhook │
└─────────┼───────────────────────────────┘
▼
┌─────────────────────────────────────────┐
│ Vercel │
│ │
│ ┌──────────────────┐ │
│ │ Build & Deploy │ │
│ │ - npm ci │ │
│ │ - next build │ │
│ │ - déploiement │ │
│ └──────────────────┘ │
│ │
│ URL : methode-architecte-ia.vercel.app │
└─────────────────────────────────────────┘

text


⚠️ **Important** : GitHub Actions et Vercel se déclenchent **en parallèle** sur le même push. Ils n'attendent pas l'un l'autre. Un déploiement Vercel peut réussir même si la CI GitHub échoue (et inversement).

---

## 2. GitHub Actions — le workflow `CI`

### Emplacement

Fichier : `.github/workflows/ci.yml`

### Déclencheurs

- `push` sur la branche `main`
- `pull_request` ciblant la branche `main`

### Contenu du job `quality`

Le workflow exécute un seul job nommé `quality` sur `ubuntu-latest`, avec 6 steps :

| # | Step | Action |
|---|---|---|
| 1 | Checkout | `actions/checkout@v4` — récupère le code |
| 2 | Setup Node | `actions/setup-node@v4` — installe Node 20 + cache npm |
| 3 | Install | `npm ci` — installe les dépendances |
| 4 | Lint | `npm run lint` — ESLint |
| 5 | Build | `npm run build` — build Next.js de production |
| 6 | Test | `npm test` — Vitest |

### Résultat visible

Onglet **Actions** du repo GitHub : [https://github.com/sterve9/methode-architecte-ia/actions](https://github.com/sterve9/methode-architecte-ia/actions)

Un badge vert = tout est OK. Un badge rouge = un des 6 steps a échoué. Cliquer sur le run pour voir les logs détaillés.

### Ce qui n'est PAS dans la CI

- **Playwright** (voir DT-Lot0-09 dans `decisions.md`)
- Type check TypeScript séparé — déjà couvert par `npm run build` qui échoue si TS échoue

---

## 3. Vercel — le déploiement continu

### Configuration

- **Projet Vercel** : `methode-architecte-ia`
- **Scope** : `sterve` (compte personnel)
- **Plan** : Hobby
- **Framework preset** : Next.js (auto-détecté)
- **Config custom** : aucune (pas de `vercel.json`, voir DT-Lot0-08)

### Env vars actives

| Variable | Environnements |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview |

**Pas** d'env vars sur l'environnement `Development` (voir DT-Lot0-07).

### Environnements Vercel

- **Production** : déploiement de la branche `main` — URL fixe `methode-architecte-ia.vercel.app`
- **Preview** : déploiement automatique de chaque Pull Request — URL unique générée par PR

---

## 4. Que se passe-t-il quand je fais `git push origin main` ?

### Séquence exacte

1. Le push arrive sur GitHub.
2. GitHub **déclenche 2 événements en parallèle** :
   - a) Le workflow GitHub Actions `CI` démarre
   - b) Un webhook est envoyé à Vercel
3. Côté GitHub Actions (~1 minute) :
   - Runner Ubuntu récupère le code
   - Node 20 installé, dépendances installées
   - `lint` → `build` → `test` s'exécutent séquentiellement
   - Si un step échoue, le run est marqué en rouge
4. Côté Vercel (~30 secondes) :
   - Vercel récupère le code
   - `npm ci` puis `next build` sur les serveurs Vercel
   - Si le build réussit : promotion vers l'URL de prod
   - Si le build échoue : l'ancien déploiement reste en ligne

### Que voir pour vérifier

- **CI OK** : badge vert dans l'onglet Actions du repo GitHub
- **Deploy OK** : URL prod accessible sans erreur → [https://methode-architecte-ia.vercel.app](https://methode-architecte-ia.vercel.app)

---

## 5. Que se passe-t-il quand j'ouvre une Pull Request ?

1. Ouverture de la PR sur GitHub.
2. Le workflow `CI` démarre sur le code de la PR (branche source).
3. Vercel crée un **déploiement Preview** avec une URL unique du type `methode-architecte-ia-<hash>-sterve.vercel.app`.
4. Le statut CI et le lien Preview apparaissent directement dans la PR.
5. On peut tester la Preview avant de merger.

Un merge de la PR sur `main` déclenche ensuite le flow normal du chapitre 4.

---

## 6. Rollback — comment revenir en arrière

### Rollback Vercel (le plus rapide)

1. Se connecter à [https://vercel.com/sterve/methode-architecte-ia](https://vercel.com/sterve/methode-architecte-ia)
2. Onglet **Deployments**
3. Retrouver un déploiement précédent qui fonctionnait
4. Menu `⋯` → **Promote to Production**

⚠️ **Le rollback Vercel ne modifie PAS le code Git.** La prochaine fois qu'on push sur `main`, Vercel redéploiera à nouveau la dernière version du code. Le rollback est une solution d'urgence, il faut ensuite corriger le code.

### Rollback Git (permanent)

```bash
git revert <hash_du_commit_fautif>
git push origin main
Ceci crée un nouveau commit qui annule le précédent, ce qui redéclenche la CI + le déploiement Vercel.

7. URLs utiles
Ressource	URL
Repo GitHub	https://github.com/sterve9/methode-architecte-ia
GitHub Actions	https://github.com/sterve9/methode-architecte-ia/actions
Dashboard Vercel	https://vercel.com/sterve/methode-architecte-ia
URL Production	https://methode-architecte-ia.vercel.app
Dashboard Supabase	https://supabase.com/dashboard/project/tegcvrdejkwysrtxdvnx
