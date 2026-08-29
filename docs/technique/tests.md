# Tests — Exécution locale et en CI

Ce document explique comment lancer les tests du projet et ce que
chaque commande couvre. Pour le choix des frameworks, voir `decisions.md`
(`DT-Lot0-03`, `DT-Lot0-04`, `DT-Lot0-09`, `DT-Lot0-10`).

Public visé : moi-même dans 6 mois, ou toute personne devant vérifier
qu'un changement ne casse rien avant de committer.

---

## 1. Tests unitaires et composants — Vitest

```bash
npm test        # mode watch, pour le développement
npm run test:run  # mode run unique, utilisé en CI
```

**Périmètre scanné** : `__tests__/` + tout fichier `*.test.ts`/`*.test.tsx`,
à l'exclusion de `node_modules`, `dist`, `.next` et `e2e/**` (config dans
`vitest.config.mts`).

**Environnement** : `jsdom` + `@vitejs/plugin-react`, ce qui permet de
tester à la fois du code Node pur (domain, actions) et des composants React.

---

## 2. Tests end-to-end — Playwright

```bash
npm run test:e2e
```

**Périmètre** : dossier `e2e/`, config dans `playwright.config.ts`
(navigateur Chromium, serveur de dev lancé automatiquement sur
`localhost:3000`).

**Scénarios existants** :
- `e2e/smoke.spec.ts` — vérifie que `/` s'affiche.
- `e2e/chaine-critique.spec.ts` — le test E2E métier obligatoire défini
  par `12.Strategie_Tests.md` §8 : connexion → création d'un Projet →
  cadrage → Étape marquée Terminée → Livrable attaché puis publié →
  transformation en Preuve publique → consultation de la Preuve sans
  authentification. Ce test **nécessite deux variables d'environnement**
  dans `.env.local` : `E2E_USER_EMAIL` et `E2E_USER_PASSWORD`, pointant
  vers l'unique utilisateur du système (pas de seed dédié, `DT-Lot1-01`).
  Sans ces variables, le test est automatiquement ignoré (`test.skip`).
  Le test crée un projet réel préfixé `[E2E]` et l'archive lui-même en
  fin de parcours (pas de suppression physique possible, `DT-Lot2-01`).
- `e2e/acces-public-prive.spec.ts` — verrouille la frontière public / privé
  appliquée par le proxy (`DT-Lot5-07`) : `/p` et `/p/[slug]` restent
  atteignables sans authentification, toute route `/dashboard/*` redirige
  un anonyme vers `/login`. **Fichier séparé volontairement** : ces tests
  n'ont besoin d'aucun compte, et les loger dans `chaine-critique.spec.ts`
  les soumettrait à son `test.skip()` global sur `E2E_USER_EMAIL` — ils
  seraient silencieusement sautés dès que la variable manque, soit
  exactement le faux vert qu'ils existent pour empêcher. Ils n'écrivent
  rien en base.

**Non couvert par ce test** : l'enregistrement des 4 événements clés
dans la table `events` — cette table n'existe pas encore, elle est
l'objet du Lot 5 (`decisions.md`, `DT-Lot5-01`). Le test sera étendu
à ce moment-là.

**Règle de nettoyage** — le test doit retirer **chaque objet publié**
par le parcours, pas seulement l'objet racine : archiver le projet ne
retire pas sa preuve de la vitrine `/p`, qui liste les preuves par
statut et non par projet. Le test archive donc explicitement la preuve
puis le projet (`decisions.md`, `DT-Lot5-05`).

**Génération de posts (M4) : volontairement hors tests automatisés.**
L'appel à l'API Claude est payant et la CI tourne à chaque push — l'y
inclure ferait payer chaque commit. Seul le domaine pur est couvert par
Vitest (`buildPostPrompt`, `parsePostDraft`) ; l'appel réel se vérifie
à la main depuis `/dashboard/diffusion`.

Playwright est désormais exécuté en CI (voir §3 et `decisions.md`,
`DT-Lot5-02`, qui remplace `DT-Lot0-09`).

---

## 3. CI (GitHub Actions)

Le workflow `.github/workflows/ci.yml` exécute, dans l'ordre :

```bash
npm ci
npm run lint
npm run build
npm run test:run
npx playwright install --with-deps chromium
npm run test:e2e
```

Détail du pipeline complet (CI + déploiement Vercel) : `deploiement.md`.

---

## 4. Avant chaque commit qui touche au code

Reproduire localement ce que la CI va exécuter (règle "fail-fast avant
push", `CLAUDE.md`) :

```bash
npm run lint
npm run build
npm run test:run
```

Si les 3 passent en local, la CI passera aussi.

---

## 5. Zones non testées automatiquement — risque assumé

Exigence de `12.Strategie_Tests.md` §9 : « les zones non testées
automatiquement sont explicitement listées et le risque est assumé ».
Cette liste a été établie à la séance S23, lors de l'audit des conditions
de sortie du MVP. **Elle est à relire à chaque lot.**

| Zone | Ce qui n'est pas couvert | Pourquoi c'est assumé |
|---|---|---|
| Server Actions | Leur conformité RLS réelle. Les tests d'émission (`events-emission.test.ts`) doublent Supabase : ils prouvent l'appel, pas l'écriture. | Couvert de bout en bout par `chaine-critique.spec.ts`, qui tourne contre la vraie base. |
| `queries/` (M1, M2, M3, M5) | Aucun test unitaire. | Ce sont des enveloppes de requêtes Supabase : les doubler ne testerait que le double. Couvertes indirectement par le E2E. |
| Composants `ui/` | Aucun test de rendu, alors que Vitest tourne sous `jsdom` et en serait capable. | Le rendu est vérifié par le E2E sur le parcours critique. Un test de rendu deviendra utile le jour où un composant portera de la logique. |
| Migrations SQL et policies RLS | Aucun test automatisé. | Vérifiées à la main via l'API REST Supabase, en `anon` et en authentifié (voir la section « Vérification » de `DT-Lot5-09` pour le protocole). |
| Refresh de session du proxy | `isPublicPath` est testée unitairement, mais pas `updateSession` : le rafraîchissement des cookies Supabase n'est éprouvé qu'à l'usage. | Il n'a commencé à tourner qu'au Lot 5 (`DT-Lot5-07`). Premier suspect en cas de déconnexion inattendue. |
| Génération de posts (M4) | L'appel réel à l'API Anthropic. Seuls `build-post-prompt` et `parse-post-draft` sont testés. | Décision de coût explicite : la CI tourne à chaque push, chaque génération est payante. Conséquence : le rendu sur une variété de contenus réels reste inconnu. |

Deux effets de bord connus du test E2E, tracés ailleurs mais rappelés ici :

- Il écrit dans la base de **production** à chaque exécution (`DT-Lot5-02`).
  Il archive son projet et retire sa preuve de la vitrine, mais n'efface rien
  physiquement.
- Ses **événements ne sont pas supprimables** : le journal `events` est
  append-only (`DT-Lot5-09`). Ils sont écartés de la cadence à la lecture,
  sur le préfixe `[E2E]` du nom du projet.

---

## 6. Pour aller plus loin

- Stratégie de tests par lot (règles, critères de sortie) : `12.Strategie_Tests.md`
- Pipeline CI/CD complet : `deploiement.md`
- Le "pourquoi" de chaque choix d'outillage : `decisions.md`
