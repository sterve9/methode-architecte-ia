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

**Statut** : Remplacée par DT-Lot5-02 (S21) — la condition posée en conséquence ci-dessous ("quand un premier test E2E métier réel existera") est remplie.
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

**Statut** : **Remplacée par `DT-Lot5-07`** (29/08/2026) — l'emplacement retenu ici
(racine du dépôt) n'est pas lu par Next.js 16 quand le code vit sous `src/` : le
proxy n'a jamais été appliqué. Texte d'origine conservé ci-dessous.
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

**Contexte** : les objets `Étape méthode` et `Livrable` introduits au Lot 3 n'avaient pas de cycle de vie défini (documenté comme "non covered" dans `05.Cycle_de_Vie.md` section 7 avant S16). Il faut fixer états et transitions avant toute implémentation.

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

**Statut** : Exécuté (S19)
**Date** : S16

**Contexte** : lors de la session de conception S16, l'utilisateur a exprimé un doute légitime sur la valeur perçue du système MVP : "je stocke des URL vers des livrables qui vivent ailleurs, où est la valeur ajoutée réelle par rapport à un Notion ?". Le doute portait notamment sur l'absence de publication automatique sur les canaux externes (LinkedIn, etc.), explicitement exclue du MVP dans `11.Plan_Implementation.md` section 6.

**Décision** : ne pas modifier le MVP maintenant. Poursuivre les Lots 3, 4, 5 tels que planifiés. **Instaurer un point de contrôle explicite à la clôture du Lot 4** (Preuves publiques) pour réévaluer honnêtement la valeur perçue du système avant d'enchaîner sur le Lot 5.

Si à ce moment la valeur reste floue pour l'utilisateur, la priorité devra basculer vers une **piste de génération assistée de contenu** (production automatique de brouillons de posts LinkedIn/Twitter/etc. via IA, à copier-coller manuellement) plutôt que sur le Lot 5 (Instrumentation). Cette piste combine haute valeur perçue et faible coût technique (aucune intégration OAuth avec les canaux externes, aucune fragilité liée aux API tierces).

**Alternatives envisagées** :
- **Ajouter la publication assistée dès le Lot 3** — écarté : gèle le Lot 3 sur une décision produit avant d'avoir vécu la vraie usage du MVP. Anti-pattern "construire pour un besoin projeté, pas prouvé".
- **Ajouter la publication automatique OAuth (LinkedIn API) au MVP** — écarté : coût technique disproportionné (OAuth, validation LinkedIn Developer, quotas, fragilité API), valeur non prouvée à la cadence actuelle (quelques publications par mois maximum). Le copier-coller manuel reste trivial.
- **Ignorer le doute et poursuivre sans point de contrôle** — écarté : le doute est légitime et documenté, l'ignorer serait construire à l'aveugle.

**Conséquences** :
- À la clôture du Lot 4, le point de contrôle a été exécuté. Le constat est que la valeur reste floue tant que l'UX est brute et les données factices. Décision formalisée dans `DT-Lot4-04`.

---

### DT-Lot3-04 — Clonage atomique des étapes par fonction RPC PostgreSQL

**Statut** : Validé
**Date** : S17 (2026-08-21)

**Contexte** : La création d'un projet doit entraîner le clonage immédiat des 13 étapes du canevas de la version active (`is_active = true`). Deux opérations d'écriture séparées côté application (`INSERT projects` puis `INSERT method_steps`) risquerait de laisser un projet orphelin sans étapes en cas de panne réseau ou de crash du serveur entre les deux requêtes. Supabase JS ne proposant pas de transaction multi-requêtes côté client, il faut garantir l'atomicité de la création au niveau de la base de données.

**Décision** : Créer une fonction PL/pgSQL RPC (`create_project_with_steps`) dans une migration SQL. Cette fonction effectue l'insertion du projet ET le clonage des étapes associées au sein d'une transaction PostgreSQL unique. L'action Next.js `createProject` utilisera un appel unique `supabase.rpc('create_project_with_steps', ...)`.

**Alternatives envisagées** :
- **Atomicité applicative avec rollback manuel** — écarté : complexe, verbeux, et peu fiable si l'échec réseau survient au moment de la tentative de rollback.
- **Requêtes clients séparées sans transaction** — écarté : viole l'invariant métier selon lequel tout projet possède ses 13 étapes à la naissance.

**Conséquences** :
- Création d'une migration SQL hébergeant la fonction `create_project_with_steps`.
- La fonction RPC prend en charge la récupération de la version active, la création du projet avec le `user_id` de la session (`auth.uid()`), et le clonage via `INSERT INTO method_steps ... SELECT`.
- La Server Action `src/modules/m1-projets/actions/create-project.ts` est mise à jour pour consommer la RPC.
- GRANT explicite `GRANT EXECUTE ON FUNCTION create_project_with_steps TO authenticated` pour respecter la sécurité RLS/permissions.

---

## Convention de mise à jour

- Une décision figée ne se **supprime jamais** : on la marque `Déprécié` ou `Remplacée par DT-YY`.
- Une nouvelle décision remplaçant une ancienne cite explicitement le code de l'ancienne.
- Les décisions sont **rétrospectives** : on documente ce qui a été décidé, pas ce qu'on projette de décider.

---

### DT-Lot4-01 — Modèle de données Preuve publique (`public_proofs`)

- **Date :** 21/08/2026
- **Statut :** Accepté
- **Contexte :**
  Le Lot 4 introduit le module M3 (Preuves publiques), dont le but est de transformer un travail méthodologique interne (Livrables M2 à l'état `Publié`) en vitrine publique de compétence.
- **Décisions :**
  1. **Table SQL :** Création de la table `public_proofs` dans Supabase (conforme au plan `11.Plan_Implementation.md`).
  2. **Cardinalité MVP :** 1 Preuve publique est rattachée à **1 Livrable source principal** (`deliverable_id` comme clé étrangère `NOT NULL`). L'extension vers N livrables sources via table de jonction est différée post-MVP.
  3. **Identifiant public :** Utilisation d'un `slug` unique (`VARCHAR NOT NULL UNIQUE`) pour générer des URL lisibles et partageables (`/p/[slug]`).
  4. **Cycle de vie :** Champ `status` restreint aux valeurs `'brouillon'`, `'publié'`, `'archivé'`.
- **Conséquences :**
  - Validation applicative stricte : un Livrable ne peut être sélectionné comme source que s'il est à l'état `'Publié'` (`SL2`).
  - Interface de création simplifiée et rapide pour la publication d'une preuve.

---

### DT-Lot4-02 — Surface d'exposition publique M7 & Sécurité RLS

- **Date :** 21/08/2026
- **Statut :** Accepté
- **Contexte :**
  Les preuves publiques doivent être consultables par des recruteurs, prospects ou visiteurs venant de réseaux sociaux (LinkedIn, TikTok) sans nécessiter d'authentification.
- **Décisions :**
  1. **Routes publiques :**
     - `/p` : Index portfolio listant toutes les preuves publiées.
     - `/p/[slug]` : Fiche détaillée "Récit de compétence" d'une preuve publique.
  2. **Politique RLS Supabase (Row Level Security) :**
     - **Lecture publique (anon) :** Autorisée uniquement sur la table `public_proofs` où `status = 'publié'`.
     - **Écriture / Modification (authenticated) :** Réservée à l'utilisateur connecté propriétaire du projet.
  3. **Gestion des états fermés :** Toute requête anonyme vers une preuve en `brouillon` ou `archivé` doit retourner un code HTTP 404 (Not Found) sans divulguer l'existence de la ressource.
- **Conséquences :**
  - Étanchéité totale des données privées (projets, étapes, livrables non publiés restent invisibles au public).
  - Intégration parfaite du responsive mobile pour la consultation via bio TikTok ou lien LinkedIn.

---

### DT-Lot4-03 — URL Canonique & Préparation au sous-domaine `sterveshop.cloud`

- **Date :** 21/08/2026
- **Statut :** Accepté
- **Contexte :**
  L'application est hébergée sur Vercel (`methode-architecte-ia.vercel.app`), mais un sous-domaine personnalisé dédié (ex: `[sous-domaine].sterveshop.cloud`) sera configuré à terme.
- **Décisions :**
  1. La base de données ne stocke jamais d'URL absolue dans `public_proofs` (uniquement le `slug`).
  2. La route publique relative est figée sous le motif `/p/[slug]`.
  3. La construction des URL absolues partagées (OpenGraph, boutons "Copier le lien") est effectuée au runtime en se basant sur le header `Host` ou les variables d'environnement Vercel/Next.js.
- **Conséquences :**
  - Migration vers le sous-domaine `sterveshop.cloud` transparente et sans aucune modification en base de données.
  - Garantie de liens valides quel que soit l'environnement (développement local, prévisualisation, production).

---

### DT-Lot4-04 — Crash Test Contenu Réel & Polissage UX de la Surface Publique avant le Lot 5

- **Date :** 24/08/2026
- **Statut :** Accepté
- **Contexte :**
  Suite au point de contrôle obligatoire fixé par `DT-Lot3-03` à la clôture du Lot 4, la valeur perçue du système a été évaluée. Bien que la chaîne technique M3/M7 (création de preuve, publication et restitution sur `/p/[slug]`) soit 100 % opérationnelle et validée par le tag `v0.6.0-lot4`, la valeur métier démontrable reste floue pour l'utilisateur. Les raisons identifiées sont l'absence de polissage UX/UI sur la vitrine publique et l'utilisation exclusive de données factices minimales lors des tests.
- **Décisions :**
  1. **Pause UX & Contenu avant le Lot 5 :** Suspendre le démarrage du Lot 5 pour consacrer la Séance 20 (S20) au polissage de la surface d'exposition publique (`/p` et `/p/[slug]`) et à un crash-test sur du contenu réel.
  2. **Design "Studio / Substack-Medium" :** Transforme la fiche de preuve `/p/[slug]` en une étude de cas professionnelle et élégante (cartes retravaillées, typographie soignée, badges de certification, boutons de partage LinkedIn/X).
  3. **Crash-Test Contenu Réel :** Injecter un projet d'architecture IA complet doté de vrais textes métier et de vrais livrables pour éprouver l'impact émotionnel et professionnel du Récit de Compétence.
- **Alternatives envisagées :**
  - *Passer immédiatement au Lot 5 sans retoucher l'UX* — écarté : risque de construire un système techniquement complexe mais sans valeur perçue par l'utilisateur final.
  - *Refonte globale du Dashboard en Tailwind* — écarté : effort trop vaste ; la priorité absolue va à la vitrine publique anonyme qui porte la promesse d'exposition de compétence.
- **Conséquences :**
  - Le démarrage du Lot 5 est décalé à la Séance 21 (S21).
  - La S20 produira une vitrine publique hautement crédible, esthétique et directement partageable.

---

### DT-Lot5-01 — Révision méthode préalable au Lot 5 : contrats manquants et rattachement Mesure/Événement

- **Date :** 29/08/2026
- **Statut :** Accepté
- **Contexte :**
  Avant de démarrer le Lot 5 (Instrumentation), une relecture complète de `07.Contrats.md` et `08.Architecture.md` a révélé deux incohérences documentées entre fiches méthode : (1) le flux F8 (M3 Preuves → M7 Consultation) listé dans `08.Architecture.md` ne correspondait à aucun contrat dans `07.Contrats.md` — c'est la cause documentée de l'entorse actuelle du code (`src/app/p/` qui lit directement les queries de M3 au lieu de passer par un module M7) ; (2) les 4 événements clés attendus par le Lot 5 (`11.Plan_Implementation.md`) — projet créé, étape terminée, livrable attaché, preuve publiée — n'étaient couverts que partiellement par les contrats existants alimentant C5 (CT-04 pour les projets, CT-05 pour la diffusion, hors MVP). Il fallait aussi trancher si la table technique `events` du Lot 5 justifiait un nouvel objet métier "Événement", alors que la liste des 10 objets métier de `03.Objets_Metier.md` est explicitement figée depuis la Phase 1.
- **Décisions :**
  1. **Pas de nouvel objet métier.** La table `events` est l'implémentation technique (Phase 3) du concept déjà couvert par l'objet métier "Mesure" (fiche 6 de `03.Objets_Metier.md`, figée en Phase 1). Aucune modification de la liste des 10 objets métier.
  2. **Ajout du contrat CT-09 (C3 → C7)** dans `07.Contrats.md` : "Exposer une preuve publique", comblant le flux F8 qui n'avait jamais eu de contrat formel.
  3. **Ajout des contrats CT-10 (C2 → C5) et CT-11 (C3 → C5)** dans `07.Contrats.md`, couvrant respectivement "étape terminée / livrable attaché" et "preuve publiée" — les 2 événements du Lot 5 qui n'avaient aucun contrat. L'événement "projet créé" reste couvert par CT-04 existant, dont le déclencheur est clarifié comme incluant la transition initiale vers l'état `Idée`.
  4. **Ajout de la section 6 dans `08.Architecture.md`** renvoyant vers `CLAUDE.md` comme source normative de la convention de dossier `src/modules/mX-nom/` (domain/actions/queries/ui/types.ts), absente de la méthode jusqu'ici.
  5. **Ajout des flux F9 (M2 → M5) et F10 (M3 → M5)** dans le tableau de `08.Architecture.md`, pour refléter CT-10/CT-11.
- **Alternatives envisagées :**
  - *Ajouter "Événement" comme 11e objet métier* — écarté : rouvre une décision de Phase 1 (liste figée) pour un besoin qui est en réalité une implémentation technique de "Mesure", déjà couverte en Phase 1.
  - *Corriger uniquement le code (créer M7, ajouter les émissions d'événements) sans toucher aux fiches méthode* — écarté : violerait la règle RM-03 (`13.Documentation.md`) selon laquelle la documentation méthode n'évolue que par révision explicite, jamais au fil de l'implémentation.
- **Conséquences :**
  - Le flux F8 et les 4 événements du Lot 5 ont désormais une base contractuelle explicite avant tout code.
  - Le flux F6 (M6 → M1, "création d'une mission associée") reste sans contrat correspondant dans `07.Contrats.md` — gap analogue mais côté M6, hors MVP, non traité par cette décision.
  - Le Lot 5 (Instrumentation) et la formalisation de M7 Consultation peuvent maintenant être conçus sans improviser de spec en cours de route.

---

### DT-Lot5-02 — Câblage de Playwright en CI et résolution du test E2E obligatoire du Lot 4

- **Date :** 29/08/2026
- **Statut :** Accepté — remplace `DT-Lot0-09`
- **Contexte :**
  `DT-Lot0-09` acceptait explicitement l'absence de Playwright en CI "jusqu'à un premier test E2E métier réel". Ce moment est arrivé : `12.Strategie_Tests.md` §8 impose un test E2E obligatoire pour le Lot 4 (parcours complet Projet → Étape → Livrable → Preuve publique consultée sans authentification), qui n'avait jamais été écrit malgré le tag `v0.6.0-lot4`. PT-05 impose par ailleurs que ce test soit automatisé en CI, pas seulement en local.
- **Décisions :**
  1. **Écriture de `e2e/chaine-critique.spec.ts`**, couvrant tous les éléments obligatoires de `12.Strategie_Tests.md` §4 sauf l'enregistrement des 4 événements dans la table `events` (Lot 5, pas encore construit — le test sera étendu à ce moment).
  2. **`dotenv` ajouté en devDependency** : Playwright ne charge pas `.env.local` automatiquement contrairement à Next.js ; sans ça, les identifiants de test restent invisibles au process de test (`playwright.config.ts`).
  3. **Identifiants de test = l'utilisateur unique de l'app** (`E2E_USER_EMAIL`/`E2E_USER_PASSWORD`), pas un compte séparé — cohérent avec `DT-Lot1-01` (pas de multi-user, pas de seed dédié).
  4. **Nettoyage par archivage** : le test crée un projet réel préfixé `[E2E]` et l'archive lui-même en fin de parcours (pas de suppression physique possible, `DT-Lot2-01`).
  5. **Playwright ajouté à `.github/workflows/ci.yml`**, sur le même déclencheur que le reste de la CI (push + PR sur `main`). Secrets GitHub Actions requis : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`.
- **Alternatives envisagées :**
  - *Provisionner un environnement Supabase de test séparé* — écarté : nouvelle infra à maintenir pour un projet solo dev, contraire à PT-06/PD-06.
  - *Ne pas câbler Playwright en CI, garder la vérification uniquement locale avant push* — écarté : viole PT-05 ("aucun test critique ne repose sur une vérification manuelle") et l'exit condition correspondante de `12.Strategie_Tests.md` §9.
- **Conséquences :**
  - Chaque push et chaque PR sur `main` crée puis archive désormais un projet `[E2E]` réel dans la base de production — accepté comme coût du choix "pas d'environnement de test séparé".
  - Le critère de sortie test du Lot 4 (`12.Strategie_Tests.md` §8) est maintenant rempli, à l'exception de la vérification des événements (dépend du Lot 5).
  - `docs/technique/deploiement.md` et `tests.md` mis à jour en conséquence.

---

### DT-Lot5-03 — Confirmation du périmètre Lot 5 = Instrumentation ; pivot DT-Lot3-03 non déclenché

- **Date :** 29/08/2026
- **Statut :** **Remplacée par DT-Lot5-04** (le même jour, en séance S21 — voir l'ADR pour le critère qui a changé)
- **Contexte :**
  `DT-Lot3-03` posait une condition explicite : si la valeur perçue du système reste floue après le point de contrôle de fin de Lot 4, la priorité doit basculer vers la génération assistée de contenu IA plutôt que sur le Lot 5 (Instrumentation). Le point de contrôle a eu lieu (`DT-Lot4-04`, S20) et le bilan de fin de séance a conclu à une valeur perçue "déjà un peu présente — positif mais partiel", pas un rejet franc. Le prompt de reprise S21 avait par ailleurs redéfini, sans decision écrite, "Lot 5" comme couvrant M4 Diffusion + M5 Mesures + M6 Missions + M7 Consultation réunis — perimetre qui ne correspondait ni au plan officiel (`11.Plan_Implementation.md`, Lot 5 = Instrumentation seule) ni à la piste ouverte par `DT-Lot3-03` (génération de contenu, pas M4/M6 complets). Il fallait donc trancher explicitement avant toute construction.
- **Décision :**
  Le verdict "positif mais partiel" de fin de Lot 4 est jugé insuffisant pour déclencher le pivot prévu par `DT-Lot3-03` (qui visait un cas de valeur restée franchement floue). Le Lot 5 (Instrumentation) est donc confirmé comme prochain chantier, conformément au plan officiel — sa base contractuelle et documentaire vient d'être posée (`DT-Lot5-01`, `DT-Lot5-02`). M4 Diffusion et M6 Missions restent hors MVP (`11.Plan_Implementation.md` §6), sans decision qui les rouvre. Le pivot `DT-Lot3-03` (génération de contenu IA) reste une option disponible, à réévaluer après clôture du Lot 5 si le besoin se représente.
- **Alternatives envisagées :**
  - *Activer le pivot DT-Lot3-03 maintenant* — écarté : le verdict S20 n'est pas le cas de flou franc que la décision anticipait.
  - *Suivre la définition élargie du prompt de reprise S21 (M4+M5+M6+M7)* — écarté : aurait rouvert M4/M6 hors MVP sans decision explicite, en violation de P-04 (`11.Plan_Implementation.md`).
- **Conséquences :**
  - Le Lot 5 (Instrumentation) démarre sur la base posée par `DT-Lot5-01`/`DT-Lot5-02`, sans ambiguïté de périmètre.
  - Cette décision sert de référence pour tout futur prompt de reprise qui redéfinirait "Lot 5" différemment du plan officiel.

---

### DT-Lot5-04 — Activation du pivot DT-Lot3-03 : génération assistée de posts (M4 Diffusion)

- **Date :** 29/08/2026
- **Statut :** Accepté — **remplace DT-Lot5-03**
- **Contexte :**
  `DT-Lot5-03`, écrite quelques heures plus tôt dans la même séance S21, concluait que le pivot `DT-Lot3-03` n'était pas déclenché et que le Lot 5 (Instrumentation) démarrait. Ce raisonnement s'appuyait sur le seul critère posé par `DT-Lot3-03` : la valeur perçue est-elle restée franchement floue après le Lot 4 ? Réponse : non ("positif mais partiel").

  Un critère différent est apparu ensuite dans la séance : l'objectif explicite de **terminer sur une valeur perceptible**. Or le Lot 5 tel que défini par `11.Plan_Implementation.md` (table `events`, enregistrement de 4 événements, "consultation interne, pas de dashboard analytique") est par nature invisible — comme l'était le chantier de structuration qui venait de s'achever (`DT-Lot5-01`, `DT-Lot5-02`). Le construire aurait reproduit le problème que la séance cherchait précisément à résoudre.
- **Décisions :**
  1. **Le pivot `DT-Lot3-03` est activé**, non pas parce que son critère de déclenchement est rempli, mais sur un critère nouveau et assumé : produire un artefact dont la valeur se constate immédiatement. Le Lot 5 Instrumentation n'est pas annulé, il est repoussé.
  2. **M4 Diffusion entre dans le périmètre, en diffusion *assistée* uniquement** : génération d'un brouillon de post à copier-coller. La diffusion *automatisée* (OAuth, publication via API tierce) reste explicitement hors MVP (`11.Plan_Implementation.md` §6). Cette entrée satisfait l'exigence P-04 (aucune fonctionnalité n'entre sans décision explicite).
  3. **Implémentation du contrat CT-03 (C3 → C4)** en sous-ensemble : M3 émet la charge utile via `getProofForDiffusion`, M4 la consomme. M4 ne lit jamais `public_proofs` (respect de CA-06).
  4. **Première intégration LLM du projet** : SDK `@anthropic-ai/sdk`, modèle `claude-opus-5`, appel côté serveur uniquement. Introduit `ANTHROPIC_API_KEY`, **première variable d'environnement secrète** du projet (jusqu'ici seules les deux clés publiques Supabase existaient) — jamais préfixée `NEXT_PUBLIC_`, lue uniquement depuis un fichier `'use server'`.
  5. **Lien LinkedIn en premier commentaire** : le corps du post ne contient aucune URL, le lien part dans un second bloc copiable. Motif : LinkedIn réduit la portée des publications comportant un lien sortant. X conserve son lien dans le tweet (comportement propre à LinkedIn).
  6. **Découpage post / commentaire par délimiteur** (`===PREMIER_COMMENTAIRE===`) plutôt que par structured outputs de l'API. Motif : le parseur reste une fonction pure testable sans appel réseau ni coût. Dégradation gracieuse si le délimiteur manque (tout le texte devient le corps du post).
- **Alternatives envisagées :**
  - *Générateur par gabarit, sans IA* — écarté : coût nul mais rendu formulaire, incapable de produire la perception de valeur recherchée.
  - *Construire le Lot 5 Instrumentation comme prévu* — écarté : invisible par nature, aurait manqué l'objectif de la séance.
  - *Structured outputs de l'API pour le découpage* — écarté : rend le découpage non testable hors appel réseau payant, pour un gain de robustesse marginal sur une consigne simple.
- **Conséquences :**
  - Le Lot 5 (Instrumentation) reste à faire et redevient le chantier suivant par défaut.
  - Chaque génération coûte environ 0,02 $. L'appel n'est **pas** ajouté au test E2E : la CI tourne à chaque push, cela ferait payer chaque commit. Seul le domaine pur est couvert par Vitest.
  - Constat annexe fait en chemin : la dette tsconfig décrite dans `DT-Lot1-03` (alias `@/*` pointant vers `./*`) **est en réalité déjà résolue** — le fichier contient `"@/*": ["./src/*"]` et les imports utilisent bien la forme standard `@/modules/...`.

---

### DT-Lot5-05 — Le test E2E polluait la vitrine publique ; ajout du retrait de preuve

- **Date :** 29/08/2026
- **Statut :** Accepté
- **Contexte :**
  Le test E2E introduit par `DT-Lot5-02` archive le projet qu'il crée, mais **pas la preuve publique qu'il publie**. Or `/p` liste toutes les preuves au statut `publié` indépendamment de l'état de leur projet. Conséquence constatée en production : deux fausses preuves "Livrable E2E …" étaient visibles sur le portfolio public, une par exécution (locale puis CI). Chaque push sur `main` en aurait ajouté une.

  La cause profonde est un manque du Lot 4 : **aucune interface n'appelait `updateProofStatus` avec `'archivé'`**. La fonction et la transition existaient depuis `DT-Lot4-01`, mais une preuve publiée l'était définitivement — impossible de la retirer autrement qu'en SQL direct.
- **Décisions :**
  1. **Ajout d'un bouton "Retirer de la vitrine"** (`m3-preuves/ui/archive-proof-button.tsx`) avec confirmation, exposé sur la page `/dashboard/diffusion`. Comble le manque produit, indépendamment du test.
  2. **Le test E2E retire sa propre preuve** avant d'archiver le projet, via ce même bouton — le nettoyage passe donc par le parcours utilisateur réel, pas par un chemin dérobé.
  3. `updateProofStatus` invalide désormais aussi `/dashboard/diffusion`.
- **Conséquences :**
  - Les deux preuves E2E résiduelles ont été retirées manuellement via le nouveau bouton, ce qui a validé son fonctionnement. Vitrine vérifiée propre.
  - Leçon à retenir pour tout futur test E2E : le nettoyage doit couvrir **chaque objet publié par le parcours**, pas seulement l'objet racine. Archiver un parent ne retire pas ses enfants des surfaces publiques.

---

### DT-Lot5-06 — Le proxy racine n'est pas appliqué : constat, report du traitement

- **Date :** 29/08/2026
- **Statut :** Accepté — constat, traitement reporté. **Traité par `DT-Lot5-07`** (29/08/2026, séance S22).
- **Contexte :**
  En vérifiant que la vitrine est bien accessible aux visiteurs anonymes, le comportement réel s'est avéré contredire le code : `/` figure dans `PUBLIC_PATHS` mais redirige (307), `/p` n'y figure pas mais répond 200. Mesuré en production en anonyme.

  Explication : `proxy.ts` est à la racine du dépôt alors que le projet utilise un dossier `src/` — Next.js l'attend à `src/proxy.ts`. Le proxy institué par `DT-Lot1-02` **n'est donc pas appliqué**. La protection des routes privées ne tient aujourd'hui que grâce aux vérifications `auth.getUser()` faites page par page, et la redirection de `/` vient de la logique propre à la page racine (commit `5e84c0f`), pas du proxy.
- **Décision :**
  Constater et documenter maintenant, **ne pas corriger dans cette séance** : le sujet est sécuritaire, mérite son propre chantier et sa propre vérification, et le corriger en fin de séance sans recul serait risqué.

  **Piège à connaître avant toute correction** : déplacer `proxy.ts` vers `src/` sans avoir d'abord ajouté `/p` à `PUBLIC_PATHS` couperait instantanément l'accès anonyme à toute la vitrine publique.
- **Conséquences :**
  - Toute nouvelle page privée doit faire sa propre vérification `auth.getUser()` sans se reposer sur le proxy — c'est ce que fait `/dashboard/diffusion`.
  - Chantier à ouvrir en priorité à la prochaine séance.

---

### DT-Lot5-07 — Le proxy est appliqué (déplacé sous `src/`) et la vitrine explicitement déclarée publique

- **Date :** 29/08/2026
- **Statut :** Accepté — **traite `DT-Lot5-06`**, **remplace `DT-Lot1-02`**
- **Contexte :**
  `DT-Lot5-06` avait constaté que le proxy n'était pas appliqué, sans le corriger. Vérification faite dans la doc embarquée (`node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, § Convention) : le fichier doit vivre « in the project root, **or inside `src` if applicable, so that it is located at the same level as `pages` or `app`** ». L'app étant sous `src/app/`, le seul emplacement valide est `src/proxy.ts`. `DT-Lot1-02` avait donc institué un proxy à un emplacement que Next.js 16 ne lit jamais dans cette structure.

  **Mesure « avant », en anonyme, sur le serveur local** — plus mauvaise que ce que décrivait `DT-Lot5-06` :

  | Route | Avant | D'où venait le comportement |
  |---|---|---|
  | `/` | 307 → `/login` | logique propre à `src/app/page.tsx`, pas le proxy |
  | `/p` | 200 | aucune protection : le proxy ne tournait pas |
  | `/dashboard`, `/dashboard/diffusion` | 307 → `/login` | `auth.getUser()` de la page |
  | `/dashboard/projects` | **500** | aucune vérification de session ; `listProjects()` throw sur `permission denied for table projects` |

  **Audit des 7 pages de `src/app/`** (angle mort n°4 du prompt de reprise S22) : seules 3 vérifiaient la session (`/dashboard`, `/dashboard/diffusion`, `/dashboard/projects/new`). Les 4 pages projets (`/dashboard/projects`, `[id]`, `[id]/edit`, `[id]/archive`) ne la vérifiaient pas — contredisant l'affirmation de `architecture.md` §4 selon laquelle « toutes les pages du dashboard » le faisaient.

  **Pas d'exposition de données pour autant** : le rôle `anon` ne reçoit aucun GRANT sur `projects`, `method_steps` ni `deliverables` (`20260816183121_grant_projects_permissions.sql`). Un anonyme obtenait une erreur ou un 404, jamais des données. Le défaut était réel mais relevait de la défense en profondeur, pas de la fuite.
- **Décisions :**
  1. **`proxy.ts` → `src/proxy.ts`** (`git mv`, contenu inchangé). L'import `@/lib/supabase/middleware` reste valide, `tsconfig.json` mappant déjà `@/*` sur `./src/*`.
  2. **`/p` ajouté à `PUBLIC_PATHS` et `/p/` à `PUBLIC_PREFIXES`** dans `src/lib/supabase/middleware.ts`, *dans le même commit et avant le déplacement* — c'est le piège signalé par `DT-Lot5-06`. Un commentaire dans le fichier rappelle que retirer ces entrées coupe l'accès anonyme au portfolio (CA-05, CT-09).
  3. **Défense en profondeur maintenue** : les 4 pages projets reçoivent le même bloc `auth.getUser()` → `redirect('/login')` que `/dashboard/projects/new`. Le proxy est la première ligne, la vérification de page la seconde. La règle posée par `DT-Lot5-06` (« toute page privée fait sa propre vérification ») reste donc en vigueur malgré la réparation du proxy.
  4. **Verrouillage par test E2E** : nouveau fichier `e2e/acces-public-prive.spec.ts`. Il est **séparé** de `chaine-critique.spec.ts` volontairement : ce dernier porte un `test.skip()` global conditionné à `E2E_USER_EMAIL`/`E2E_USER_PASSWORD`, et y loger un test qui n'a besoin d'aucun compte l'aurait rendu silencieusement sautable — le faux vert que ce test existe précisément pour empêcher. Ces tests n'écrivent rien en base, contrairement à la chaîne critique (`DT-Lot5-02`).
- **Vérification :**

  | Route | Anonyme, après | Attendu |
  |---|---|---|
  | `/` | 307 → `/login` | ✅ |
  | `/login` | 200 | ✅ |
  | `/p` | 200 | ✅ |
  | `/p/<slug réel>` | 200 | ✅ |
  | `/dashboard`, `/dashboard/projects`, `/dashboard/projects/<uuid>`, `/dashboard/projects/new`, `/dashboard/diffusion` | 307 → `/login` | ✅ |

  Preuve décisive : `/dashboard/projects` passe de **500 à 307 → /login** alors que cette page, à ce moment-là, n'avait encore aucune vérification propre — la redirection ne pouvait venir que du proxy. Corroboré par la sortie de `next build`, qui liste désormais une ligne `ƒ Proxy (Middleware)`.

  Suite complète verte : lint, build, 10 tests unitaires, 8 tests E2E.

  **Vérifié en production après déploiement Vercel**, en anonyme, sur les 11 routes : `/login`, `/p` et une fiche `/p/<slug>` réelle en 200 ; `/`, `/dashboard`, `/dashboard/projects`, `/dashboard/projects/new`, `/dashboard/projects/<uuid>`, `.../edit`, `.../archive` et `/dashboard/diffusion` en 307 → `/login`. Le constat de `DT-Lot5-06` avait été fait en production — sa levée l'est aussi. La mesure « avant » en prod y était identique au local, `500` inclus.
- **Conséquences :**
  - `DT-Lot1-02` est **remplacée** : la convention « `proxy.ts` à la racine » est fausse dès lors que le code vit sous `src/`. Ce que `DT-Lot1-02` conservait de juste (déléguer à `src/lib/supabase/middleware.ts`, vérifier le refresh de session à chaque modification) reste valable.
  - Le proxy rafraîchit désormais réellement les cookies Supabase à chaque requête — un comportement qui n'avait jamais tourné depuis le Lot 1.
  - **Leçon transposable** : une convention de framework validée par « le fichier existe et le code est correct » n'est pas validée. Seule une mesure du comportement réel l'est. Ce défaut a survécu à cinq lots et à un tag de production.

---

### DT-Lot5-08 — Outillage GitHub : l'API anonyme reste le canal de lecture de la CI, le MCP `github` est abandonné

- **Date :** 29/08/2026
- **Statut :** Accepté
- **Contexte :**
  La S22 avait diagnostiqué la panne du serveur MCP `github` : un PAT classique (`ghp_`) figé en clair dans `~/.claude.json`, rejeté en `Bad credentials`, dont la seule présence désactivait le repli OAuth. Le bloc `headers` avait été retiré, une sauvegarde conservée, et la vérification de la réparation reportée au premier geste de la S23.

  **Mesure faite en S23.** L'édition à froid a bien tenu : l'entrée est propre (`{type: http, url: https://api.githubcopilot.com/mcp/}`, aucun `headers`, aucun secret). Mais la connexion échoue toujours, avec une erreur **différente** de la 401 précédente : le serveur ne propose pas l'enregistrement dynamique de client (*dynamic client registration*) que le client MCP attend pour ouvrir le flux OAuth. Ce n'est donc plus un problème d'identifiants mais d'incompatibilité de négociation d'authentification — rien qui se règle côté dépôt.
- **Décision :**
  **Ne pas poursuivre la réparation du MCP `github`.** Le canal de lecture de la CI reste l'**API GitHub anonyme**, déjà éprouvée en S22 sur ce dépôt public :

  ```
  curl -s "https://api.github.com/repos/sterve9/methode-architecte-ia/actions/runs?per_page=3"
  curl -s "https://api.github.com/repos/sterve9/methode-architecte-ia/actions/runs/<ID>/jobs"
  ```

  Deux options écartées explicitement :
  - **Remettre un PAT valide en `headers`** — réintroduirait un secret en clair dans `~/.claude.json` et redésactiverait tout repli OAuth, c'est-à-dire recréerait exactement la panne silencieuse de la S22 pour un gain nul sur le besoin réel.
  - **Installer `gh` (CLI)** — absent de winget, installation manuelle, et sans effet sur le MCP. Reste utile un jour, pour une seule chose (voir ci-dessous).
- **Conséquences :**
  - `~/.claude.json.bak-avant-oauth-github` a été **supprimé** : il contenait encore l'ancien PAT en clair. Le jeton reste à révoquer sur `github.com/settings/tokens` — il est déjà rejeté par GitHub, mais un secret périmé sur disque n'a pas à survivre.
  - **Limite mesurée et assumée** : en anonyme, `runs` et `jobs` répondent (donc « la CI est-elle passée ? » et « quelle étape a échoué ? » sont couverts), mais le **téléchargement des logs répond 403**. Lire le log brut d'un run en échec nécessiterait `gh`.
  - **Condition de réouverture** : si le dépôt passait un jour en privé, l'API anonyme cesserait de répondre et `gh` deviendrait obligatoire, pas optionnel.
