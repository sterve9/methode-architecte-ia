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

## Lot 1 — Authentification

### DT-Lot1-01 — Authentification single-user (signups publics désactivés)

**Statut** : Actif
**Date** : S11

**Contexte** : le projet est un outil personnel destiné à un unique utilisateur (le créateur du projet). Il ne s'agit pas d'une application SaaS multi-tenant.

**Décision** : dans Supabase Auth, désactiver **"Allow new users to sign up"** et désactiver la **"Confirm email"**. L'unique utilisateur est créé manuellement en admin depuis le dashboard Supabase, avec Auto Confirm activé.

**Alternatives envisagées** :
- Laisser signups ouverts + confirmation email — écarté : ouvre la porte à des inscriptions parasites qui pollueraient la base
- Créer l'utilisateur via une seed SQL — écarté : sur-ingénierie pour un seul compte

**Conséquences** :
- Aucune UI de signup à développer (page /signup absente par conception)
- Les futures policies RLS Supabase (Lot 2+) pourront s'appuyer sur le principe "un seul user légitime = `auth.uid()` unique"
- Si un jour l'app doit devenir multi-user, cette DT devra être **remplacée** par une nouvelle décision, et il faudra revoir les policies RLS et créer la page /signup

---

### DT-Lot1-02 — Convention `proxy.ts` racine (Next.js 16)

**Statut** : Actif
**Date** : S11

**Contexte** : Next.js 16 introduit `proxy.ts` comme convention pour le rafraîchissement de session (remplace la convention `middleware.ts` de Next.js 13-15). Le helper Supabase SSR `updateSession()` doit être appelé sur chaque requête pour maintenir les cookies d'auth à jour.

**Décision** : créer directement `proxy.ts` à la racine du projet (pas de fichier `middleware.ts`), qui délègue à `src/lib/supabase/middleware.ts` pour la logique de refresh session + protection routes.

**Alternatives envisagées** :
- Créer `middleware.ts` puis migrer vers `proxy.ts` plus tard — écarté : générer volontairement de la dette technique alors que Next.js 16 est déjà le socle du projet
- Ne pas rafraîchir la session sur chaque requête — écarté : impossible avec Supabase SSR, la session doit être renouvelée pour rester valide

**Conséquences** :
- Zéro dette de migration `middleware` → `proxy` à traiter plus tard
- La logique reste externalisée dans `src/lib/supabase/middleware.ts` (le nom `middleware.ts` interne est purement organisationnel, il ne suit pas la convention Next.js)
- Toute modification du proxy racine doit inclure une vérification que la logique de refresh session Supabase reste correcte

---

### DT-Lot1-03 — Consolidation sous `src/app/` + dette technique alias tsconfig

**Statut** : Actif — **contient une dette technique à traiter**
**Date** : S11

**Contexte** : lors du scaffold initial Next.js, le dossier `app/` a été créé à la racine du projet. Pour uniformiser avec `src/lib/` et `src/modules/`, tout le code source doit vivre sous `src/`.

**Décision** : migrer `app/` → `src/app/`. Tout le code source vit désormais sous `src/`. Le `proxy.ts` reste à la racine (contrainte Next.js).

**Dette technique associée** : le fichier `tsconfig.json` définit toujours l'alias `"@/*": ["./*"]` au lieu de `"@/*": ["./src/*"]`. Résultat : les imports actuels utilisent la forme non-standard `@/src/lib/...` au lieu de `@/lib/...`. Cela fonctionne mais n'est pas la convention Next.js standard.

**Alternatives envisagées** :
- Corriger l'alias tsconfig immédiatement au Lot 1 — écarté : nécessite de modifier tous les imports du projet, effort dispersé sur du code auth déjà écrit et testé
- Garder `app/` à la racine — écarté : incohérence structurelle avec `src/lib/` et `src/modules/`

**Conséquences** :
- Structure uniforme `src/` respectée
- **Dette** : chaque nouvel import doit utiliser le format `@/src/lib/...` (non standard) jusqu'à traitement
- **Traitement prévu** : chantier dédié en début Lot 2 ou entre Lot 2 et Lot 3. Ne pas oublier de mettre à jour tous les imports existants dans la même PR

---
## Lot 2 — M1 Projets

### DT-Lot2-01 — Champ `archive_reason` obligatoire au niveau applicatif

**Statut** : Actif
**Date** : S15

**Contexte** : lors de l'implémentation de l'archivage des projets (étape 4 du Lot 2), le besoin métier est apparu de documenter la raison de chaque archivage. Sans cette information, les rétrospectives et les décisions futures sur des projets similaires manquent de contexte.

**Décision** : ajouter un champ `archive_reason TEXT NULL` à la table `projects`. La règle "raison obligatoire si statut = Archivé" est **validée uniquement au niveau applicatif** (Server Action `archiveProject`), pas au niveau base de données.

**Alternatives envisagées** :
- Contrainte CHECK PostgreSQL (`CHECK ((status = 'Archivé' AND archive_reason IS NOT NULL) OR (status != 'Archivé' AND archive_reason IS NULL))`) — écarté : incohérent avec la dette "validation applicative uniquement" assumée depuis S13, et rigidifie inutilement la migration
- Rendre le champ NOT NULL en base avec une valeur par défaut vide pour les projets non-archivés — écarté : sémantiquement faux (un projet non-archivé n'a pas de "raison d'archivage vide", il n'en a simplement pas)

**Conséquences** :
- La Server Action `archiveProject` valide que `archive_reason` est non-vide avant l'UPDATE
- Un UPDATE direct dans Supabase Studio pourrait créer une incohérence (projet archivé sans raison, ou raison sans archivage). Risque accepté car single-user (voir DT-Lot1-01) et Server Action unique chemin d'écriture applicatif
- Si l'app devient multi-user ou expose une API publique (Lot 6+), cette DT devra être reconsidérée : ajouter la contrainte CHECK via une migration dédiée
- La raison peut être modifiée après archivage (correction, ajout de contexte) mais pas supprimée (règle documentée dans `05.Cycle_de_Vie.md` section 4bis)

---

## Lot 3 — M2 Méthode

### DT-Lot3-01 — Structure de données Méthode : canevas versionné + livrable URL

**Statut** : Actif
**Date** : S16

**Contexte** : le Lot 3 introduit trois nouveaux objets métier dans le système : `Version de méthode` (fiche 9), `Étape méthode` (fiche 2) et `Livrable` (fiche 3). Il faut trancher trois questions structurantes avant toute migration :
1. Les étapes d'un projet sont-elles créées librement, ou clonées depuis un canevas prédéfini ?
2. Un livrable est-il un lien URL, un fichier uploadé, ou les deux ?
3. La table `method_versions` doit-elle exister maintenant ou plus tard ?

**Décision** :

1. **Canevas versionné (option B stricte)** : chaque projet est rattaché à une `Version de méthode` figée à sa création. Les étapes du projet sont clonées depuis le canevas de cette version. Pas de personnalisation par projet au Lot 3.
2. **Livrable = URL uniquement** : la table `deliverables` porte une colonne `url TEXT NOT NULL`. Pas de bucket Storage, pas de fichier uploadé.
3. **`method_versions` créée maintenant** : dans la même migration que `method_steps` et `deliverables`, avec ajout d'un champ `version_id` sur `projects` (DEFAULT = id de la v1.0 pour ne pas casser les projets existants).

Le canevas de la v1.0 est composé des **13 étapes** correspondant aux fichiers `01.Besoin_Client.md` à `13.Documentation.md` du dossier `docs/methode/`. Le fichier `99_Prompt_de_reprise.md` est exclu du canevas (mécanique de session, pas étape méthode).

**Alternatives envisagées** :
- **Étapes libres (option A)** — écarté : détruit la répétabilité qui est le cœur de valeur du système. L'utilisateur peut déjà réciter sa méthode, elle n'a pas à être réinventée par projet.
- **Étapes hybrides template + personnalisation (option C)** — écarté prématuré : introduire la personnalisation avant d'avoir vécu la contrainte stricte reviendrait à construire pour un besoin non prouvé. Option C reste ouverte pour Lot 4+ sans casser B.
- **Livrable avec upload Supabase Storage** — écarté : coût technique disproportionné (bucket, RLS storage, quotas) pour un besoin non prouvé. Toutes les preuves visées sont des artefacts externes (LinkedIn, GitHub, Vercel, Google Docs), donc naturellement des URL.
- **Reporter `method_versions` après le MVP** — écarté : sans `version_id` sur `projects`, impossible de savoir depuis quel canevas cloner les étapes. Blocage immédiat du Lot 3.

**Conséquences** :
- 4 tables créées/modifiées : `method_versions`, `method_version_steps` (le canevas), `method_steps` (les instances rattachées au projet), `deliverables`. Ajout de `version_id` sur `projects`.
- Une seule version active à un instant T (colonne `is_active` sur `method_versions`). Les nouveaux projets clonent la version active à leur création.
- La v1.0 est seedée dans la migration elle-même. Les projets existants (créés avant cette migration) sont automatiquement rattachés à la v1.0 via la valeur DEFAULT.
- Version immuable : pour faire évoluer la méthode, on crée une nouvelle version (v1.1, v2.0). Les projets antérieurs restent rattachés à leur version d'origine (historique préservé).
- L'ajout ultérieur du support fichier uploadé (post-MVP) sera une migration additive : ajouter une colonne `file_path TEXT NULL` sur `deliverables` sans casser l'existant.

---

### DT-Lot3-02 — Cycles de vie Étape méthode (3 états) et Livrable (2 états)

**Statut** : Actif
**Date** : S16

**Contexte** : les objets `Étape méthode` et `Livrable` introduits au Lot 3 n'avaient pas de cycle de vie défini (documenté comme "non couvert" dans `05.Cycle_de_Vie.md` section 7 avant S16). Il faut fixer états et transitions avant toute implémentation.

**Décision** :

**Étape méthode** — 3 états, 3 transitions :
- États : `À faire` (initial) → `En cours` → `Terminée`
- Transitions : SE-T1 (`À faire` → `En cours`), SE-T2 (`En cours` → `Terminée`), SE-T3 (`En cours` → `À faire`, retour arrière)
- Interdictions strictes : `À faire` → `Terminée` (interdit, force le passage par `En cours`), `Terminée` → tout (terminal)
- Pas d'état `Archivé` : l'archivage projet ne rétro-agit pas sur les étapes.

**Livrable** — 2 états, 2 transitions :
- États : `Brouillon` (initial) → `Publié`
- Transitions : SL-T1 (`Brouillon` → `Publié`), SL-T2 (`Publié` → `Brouillon`, dépublication)
- Cycle réversible dans les deux sens.
- Un livrable en `Publié` est prérequis pour être transformé en Preuve publique (Lot 4).

**Alternatives envisagées** :
- **Étape avec état `Bloquée`** — écarté prématuré : aucun besoin métier prouvé aujourd'hui. Ajout possible en migration additive plus tard.
- **Étape avec `Terminée → En cours` autorisé** — écarté : cohérent avec le pattern strict du Projet (`Livré` terminal). Force à réfléchir au niveau du Projet (nouvelle version) plutôt qu'à défaire une étape.
- **Livrable avec état `Archivé`** — écarté : redondant. Un livrable non pertinent peut être supprimé ; un livrable historique reste `Publié` ou `Brouillon`.
- **Livrable sans statut (juste un flag `is_published`)** — écarté : incohérent avec le pattern `status` déjà utilisé pour Projet et Étape. Uniformité du modèle prime.

**Conséquences** :
- Deux modules domain à créer sous `src/modules/m2-methode/domain/` : `step-transitions.ts` et `deliverable-transitions.ts`, sur le même pattern que `src/modules/m1-projets/domain/transitions.ts`.
- Les colonnes `status` sur `method_steps` et `deliverables` sont contraintes par `CHECK` PostgreSQL (leçon Lot 2 : les enums métier gagnent à être validés en base).
- Les Server Actions du Lot 3 doivent utiliser `assertCanTransition()` avant tout UPDATE de statut (leçon S15 : défense en profondeur UI + Server Action).
- Le cas limite `from === to` doit être testé explicitement dès l'écriture du domain (leçon S15 : bug `canTransition('Archivé', 'Archivé')` détecté après action réelle).

---

### DT-Lot3-03 — Point de contrôle valeur post-Lot 4

**Statut** : Actif — action différée obligatoire
**Date** : S16

**Contexte** : lors de la session de conception S16, l'utilisateur a exprimé un doute légitime sur la valeur perçue du système MVP : "je stocke des URL vers des livrables qui vivent ailleurs, où est la valeur ajoutée réelle par rapport à un Notion ?". Le doute portait notamment sur l'absence de publication automatique sur les canaux externes (LinkedIn, etc.), explicitement exclue du MVP dans `11.Plan_Implementation.md` section 6.

**Décision** : ne pas modifier le MVP maintenant. Poursuivre les Lots 3, 4, 5 tels que planifiés. **Instaurer un point de contrôle explicite à la clôture du Lot 4** (Preuves publiques) pour réévaluer honnêtement la valeur perçue du système avant d'enchaîner sur le Lot 5.

Si à ce moment la valeur reste floue pour l'utilisateur, la priorité devra basculer vers une **piste de génération assistée de contenu** (production automatique de brouillons de posts LinkedIn/Twitter/etc. via IA, à copier-coller manuellement) plutôt que sur le Lot 5 (Instrumentation). Cette piste combine haute valeur perçue et faible coût technique (aucune intégration OAuth avec les canaux externes, aucune fragilité liée aux API tierces).

**Alternatives envisagées** :
- **Ajouter la publication assistée dès le Lot 3** — écarté : gèle le Lot 3 sur une décision produit avant d'avoir vécu la vraie usage du MVP. Anti-pattern "construire pour un besoin projeté, pas prouvé".
- **Ajouter la publication automatique OAuth (LinkedIn API) au MVP** — écarté : coût technique disproportionné (OAuth, validation LinkedIn Developer, quotas, fragilité API), valeur non prouvée à la cadence actuelle (quelques publications par mois maximum). Le copier-coller manuel reste trivial.
- **Ignorer le doute et poursuivre sans point de contrôle** — écarté : le doute est légitime et documenté, l'ignorer serait construire à l'aveugle.

**Conséquences** :
- À la clôture du Lot 4, une séance de session commence obligatoirement par la question : "après avoir vécu le Lot 4, la valeur perçue du système est-elle claire ou toujours floue ?".
- Si la réponse est "claire" → poursuite normale vers Lot 5.
- Si la réponse est "floue" → nouvelle DT écrite pour introduire la piste "génération assistée de contenu" (probablement `DT-Lot4bis-01` ou équivalent), avec re-priorisation explicite du Lot 5.
- Cette décision est de nature **méta** (pilotage produit) et non technique pure. Elle est placée dans `decisions.md` pour être trouvable et audit-able.

---

## Convention de mise à jour

- Une décision figée ne se **supprime jamais** : on la marque `Déprécié` ou `Remplacée par DT-YY`.
- Une nouvelle décision remplaçant une ancienne cite explicitement le code de l'ancienne.
- Les décisions sont **rétrospectives** : on documente ce qui a été décidé, pas ce qu'on projette de décider.
