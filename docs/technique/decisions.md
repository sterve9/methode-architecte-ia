# Décisions techniques — Journal (ADR log)

Ce document trace les décisions techniques figées du projet **Méthode Architecte IA**.

Chaque décision suit le format ADR (Architecture Decision Record) : **Contexte → Décision → Alternatives → Conséquences**.

Elles sont numérotées par lot : `DT-Lot0-XX`, `DT-Lot1-XX`, etc.

Une décision peut être **Active**, **Dépréciée** ou **Remplacée par** une autre.

---

## Lot 0 — Socle technique

### DT-Lot0-01 — Choix du stack technique

**Statut** : Actif
**Date** : Lot 0

**Contexte** : besoin d'un stack moderne, gratuit ou à faible coût, avec un excellent DX (Developer Experience) et une prod-ready dès le Lot 0.

**Décision** : TypeScript + Next.js 16 (App Router) + PostgreSQL via Supabase + Supabase Auth + hébergement Vercel + CI GitHub Actions.

**Alternatives envisagées** :
- Remix / Astro — écartés : moins d'intégration prod-ready avec Vercel
- Firebase — écarté : verrouillage propriétaire, pas de SQL
- Auth custom / NextAuth — écarté : Supabase Auth déjà couplé à la DB

**Conséquences** :
- Tout le stack tient sur des plans gratuits jusqu'au Lot 5
- Continuité forte entre local, CI et prod (même Node 20, même Next.js)
- Dépendance forte à l'écosystème Vercel/Supabase (assumée)

---

### DT-Lot0-02 — Architecture monolithe modulaire M1-M7

**Statut** : Actif
**Date** : Lot 0

**Contexte** : besoin d'organiser le code par domaine métier plutôt que par couche technique, tout en gardant un seul déploiement (pas de microservices).

**Décision** : monolithe modulaire avec 7 modules dans `src/modules/` alignés sur les 7 composants métier C1-C7 :
- M1 Projets
- M2 Méthode
- M3 Preuves
- M4 Diffusion
- M5 Mesures
- M6 Missions
- M7 Consultation

**Alternatives envisagées** :
- Architecture par couche (`controllers/`, `services/`, `repositories/`) — écartée : dilue le sens métier
- Microservices — écarté : sur-ingénierie pour un projet perso

**Conséquences** :
- Chaque module = un domaine cohérent, faible couplage entre modules
- Un module = un lot MVP dans le plan d'implémentation
- Un `.gitkeep` par module tant qu'il n'y a pas de code réel

---

### DT-Lot0-03 — Vitest comme framework de tests unitaires et composants

**Statut** : Actif
**Date** : Lot 0

**Contexte** : besoin d'un runner de tests moderne, compatible ESM natif, rapide, et bien intégré à Vite/Next.js.

**Décision** : Vitest configuré avec `jsdom` + `@vitejs/plugin-react` pour permettre à la fois des tests Node purs et des tests de composants React.

**Alternatives envisagées** :
- Jest — écarté : config ESM complexe, plus lent, moins bien intégré à l'écosystème Vite
- Node test runner natif — écarté : trop bas niveau, pas de matchers riches

**Conséquences** :
- Config unique `vitest.config.mts` à la racine
- Périmètre : `__tests__/` + tout fichier `*.test.ts(x)` **hors** `e2e/**`
- Commande CI : `npm test`

---

### DT-Lot0-04 — Playwright comme framework de tests E2E

**Statut** : Actif
**Date** : Lot 0

**Contexte** : besoin de tester des parcours utilisateur complets dans un vrai navigateur, indépendamment de Vitest.

**Décision** : Playwright installé avec sa config par défaut, scénarios dans `e2e/`, exécuté via `npm run test:e2e`.

**Alternatives envisagées** :
- Cypress — écarté : moins performant, architecture in-browser plus limitante
- Selenium — écarté : obsolète pour du web moderne

**Conséquences** :
- Playwright reste **hors CI** au Lot 0 (voir DT-Lot0-09)
- Aucun test E2E métier n'existe encore, uniquement un test factice
- Périmètre de scan disjoint de Vitest (voir DT-Lot0-10)

---

### DT-Lot0-05 — Push AVANT import Vercel

**Statut** : Actif
**Date** : S9

**Contexte** : lors du premier import du repo dans Vercel, le framework preset a été détecté comme `Other` au lieu de `Next.js`. Raison : le repo distant ne contenait pas encore les fichiers Next.js (build local pas encore poussé).

**Décision** : **toujours pousser le code sur `origin/main` AVANT de faire un import Vercel**. Vercel a besoin de lire le contenu réel du repo pour auto-détecter le framework.

**Alternatives envisagées** :
- Configurer manuellement le framework preset dans Vercel — écarté : casse le principe "config par défaut" (voir DT-Lot0-08)

**Conséquences** :
- La règle initiale "pas de push avant Vercel" est levée pour ce projet
- Ordre officiel : `commit → build local OK → push → import Vercel`

---

### DT-Lot0-06 — URL prod = subdomain vercel.app (pas de domaine custom)

**Statut** : Actif
**Date** : S9

**Contexte** : au Lot 0, aucun besoin de branding public. Le projet est en phase d'infrastructure.

**Décision** : utiliser l'URL par défaut fournie par Vercel : `https://methode-architecte-ia.vercel.app`. Pas de domaine personnalisé.

**Alternatives envisagées** :
- Acheter un domaine custom dès le Lot 0 — écarté : coût inutile tant que le projet n'est pas exposé publiquement

**Conséquences** :
- Zéro configuration DNS
- Un domaine custom pourra être ajouté ultérieurement sans impact sur le code

---

### DT-Lot0-07 — Env vars Vercel sur Production + Preview uniquement

**Statut** : Actif
**Date** : S9

**Contexte** : Vercel propose 3 environnements pour les variables d'environnement : Production, Preview, Development.

**Décision** : ajouter les env vars Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) uniquement sur **Production** et **Preview**.

**Alternatives envisagées** :
- Ajouter aussi sur Development — écarté : le développement local se fait via `npm run dev` avec `.env.local`, jamais via `vercel dev`

**Conséquences** :
- `.env.local` reste la source de vérité pour le développement local
- Zéro duplication entre `.env.local` et le scope Development de Vercel

---

### DT-Lot0-08 — Config Vercel = 100% défaut Next.js

**Statut** : Actif
**Date** : S9

**Contexte** : Vercel permet d'ajouter un fichier `vercel.json` pour override la configuration de build/déploiement.

**Décision** : **ne pas créer de `vercel.json`**. Utiliser 100% de la config par défaut auto-détectée par Vercel pour un projet Next.js.

**Alternatives envisagées** :
- Configurer manuellement build command, output directory, install command — écarté : le preset Next.js de Vercel est déjà optimal

**Conséquences** :
- Zéro surface de configuration à maintenir côté Vercel
- Toute évolution du preset Next.js/Vercel est captée automatiquement
- Si un jour un override est nécessaire, il faudra créer une nouvelle DT

---

### DT-Lot0-09 — CI = lint + build + Vitest (Playwright reste local)

**Statut** : Actif
**Date** : S9

**Contexte** : le pipeline CI GitHub Actions doit garantir la qualité minimale avant chaque merge sur `main`, sans exploser le temps d'exécution ni la complexité de config.

**Décision** : le workflow `CI` exécute uniquement `npm run lint`, `npm run build`, `npm test` (Vitest). Playwright n'est **pas** intégré à la CI au Lot 0.

**Alternatives envisagées** :
- Intégrer Playwright dès le Lot 0 — écarté : aucun test E2E métier réel n'existe, seul un test factice. La complexité d'installation des navigateurs en CI n'est pas justifiée

**Conséquences** :
- Temps de CI < 1 minute
- Playwright sera intégré à la CI quand un premier test E2E métier réel existera (probablement Lot 1 ou Lot 2)

---

### DT-Lot0-10 — Vitest et Playwright ont des périmètres de scan disjoints

**Statut** : Actif
**Date** : S9

**Contexte** : Vitest scannait par défaut tous les fichiers `*.test.*` et `*.spec.*`, y compris ceux du dossier `e2e/`. Résultat : `npm test` crashait en essayant d'exécuter `e2e/smoke.spec.ts` comme un test Vitest.

**Décision** : configurer `vitest.config.mts` avec `exclude: ['node_modules', 'dist', '.next', 'e2e/**']` pour que Vitest ignore complètement le dossier `e2e/`.

**Alternatives envisagées** :
- Renommer les fichiers Playwright en `*.e2e.ts` — écarté : casse la convention par défaut de Playwright
- Déplacer Playwright hors du repo — écarté : absurde

**Conséquences** :
- Séparation stricte : Vitest ↔ `__tests__/` + `*.test.*` | Playwright ↔ `e2e/**`
- `npm test` et `npm run test:e2e` sont indépendants et ne se marchent jamais dessus

---

### DT-Lot0-11 — Warning Node 20 sur runtime GitHub Actions ignoré volontairement

**Statut** : Actif — dette technique planifiée
**Date** : S9

**Contexte** : GitHub Actions affiche un warning indiquant que les actions officielles (`actions/checkout@v4`, `actions/setup-node@v4`) utilisent Node 20 dans leur runtime, ce qui sera déprécié à moyen terme au profit de Node 24.

**Décision** : **ignorer ce warning au Lot 0**. Ne pas migrer vers les versions `@v5` des actions.

**Alternatives envisagées** :
- Migrer immédiatement vers `@v5` — écarté : aucune valeur métier, aucun impact fonctionnel actuel

**Conséquences** :
- Warning visible dans les logs CI (accepté)
- Migration planifiée quand la dépréciation deviendra bloquante (probablement 2026)

---

## Convention de mise à jour

- Une décision figée ne se **supprime jamais** : on la marque `Déprécié` ou `Remplacée par DT-YY`.
- Une nouvelle décision remplaçant une ancienne cite explicitement le code de l'ancienne.
- Les décisions sont **rétrospectives** : on documente ce qui a été décidé, pas ce qu'on projette de décider.
