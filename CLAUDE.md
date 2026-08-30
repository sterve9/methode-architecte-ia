@AGENTS.md

# Méthode Architecte IA — Contexte projet

## Projet

- Nom : Méthode Architecte IA
- Repo : https://github.com/sterve9/methode-architecte-ia
- Emplacement local : `C:\Dev\02_Développement\methode-architecte-ia`
- Shell : Git Bash
- URL prod : https://methode.sterveshop.cloud (l'ancienne `methode-architecte-ia.vercel.app` y redirige — DT-Lot5-11)

## Nature du projet

Double objectif :
1. **Preuve publique de compétence** — montrer une méthode reproductible d'architecte IA, projet après projet, plutôt qu'une accumulation de technos.
2. **Système personnel** — produire régulièrement ces preuves publiques sans que le temps de mise en preuve dépasse le temps du projet lui-même.

Particularité méta : ce dépôt **applique sa propre méthode à lui-même**. Le premier projet de démonstration de la méthode, c'est ce système. La méthode a 4 phases — COMPRENDRE → MODÉLISER → DÉCIDER → LIVRER — documentées dans `docs/methode/NN.Nom_Etape.md` (structure de fichiers figée, contenu propre à chaque projet).

## Architecture

- **Style** : monolithe modulaire (une seule app Next.js), 7 modules internes alignés sur 7 composants fonctionnels :
  M1 Projets · M2 Méthode · M3 Preuves · M4 Diffusion · M5 Mesures · M6 Missions · M7 Consultation.
- **Règle stricte de frontière** : un module ne lit jamais directement les données d'un autre module — tout échange passe par un contrat explicite (`docs/methode/07.Contrats.md`). M7 Consultation est censé être le seul point d'exposition publique.
- **Convention interne par module** (`src/modules/mX-nom/`) : `domain/` (règles métier, transitions d'état), `actions/` (Server Actions), `queries/`, `ui/`, `types.ts`.
- **Stack** : Next.js 16 (App Router) + React 19 + Supabase (`@supabase/ssr`, auth + Postgres) + Tailwind v4 + Vitest (unit) + Playwright (e2e).
- Next.js 16 casse des conventions connues du training — voir la règle en tête de ce fichier (`node_modules/next/dist/docs/`) avant d'écrire du code Next.

## État d'avancement (dernier jalon : Lot 5 clos, 30/08/2026 — tous les lots du MVP livrés)

- Lots 0 à 5 **clos et tagués** : v0.1.0-lot0 (auth non incluse) → v0.2.0-lot1 (auth) → v0.4.0-lot2 (M1 complet) → v0.5.0-lot3 (M2 complet) → v0.6.0-lot4 (M3 preuves publiques) → v0.7.0-lot5 (M5 instrumentation). Prod sur Vercel.
- CI GitHub Actions : verte (dernière vérification sur le commit `8e9da07`).
- Suite de tests : **127 tests unitaires** (Vitest) + **8 tests E2E** (Playwright), verts en CI. Lancer le test de chaîne critique écrit en base de production : 4 événements non supprimables par exécution.
- Modules implémentés : **M1 Projets**, **M2 Méthode** (chaque projet clone ses 13 étapes via une RPC Postgres transactionnelle `create_project_with_steps`), **M3 Preuves** (publication de livrables, vitrine `/p` et fiche `/p/[slug]`), **M4 Diffusion** (génération assistée d'un brouillon de post LinkedIn/X, copier-coller manuel — aucune publication automatique), **M5 Mesures** (table `events` append-only, `recordEvent()` unique point d'écriture, consultation interne sur `/dashboard/mesures`).
- Modules encore à l'état de coquille (`.gitkeep` seul) : **M6 Missions**, **M7 Consultation**. Noter que `/p` et `/p/[slug]` (rôle normalement dévolu à M7) sont implémentés directement dans `src/app/p/` en consommant les queries de M3, et que `/dashboard/mesures` consomme M5 de la même façon — entorse connue à CA-06, pas encore un module M7 séparé.
- **Migrations Supabase : geste manuel obligatoire.** Il n'y a ni CLI Supabase ni `psql` sur la machine, et `.env.local` ne porte que la clé `anon`. Toute migration se joue à la main dans le SQL Editor Supabase, puis est versionnée dans `supabase/migrations/`.
- **Décision DT-Lot4-04 (mise en pause du Lot 5) : dépréciée.** La pause a été levée et le Lot 5 livré en S23. Conservée telle quelle dans `docs/technique/decisions.md`, qui n'est jamais réécrit.

## Séance en cours

L'objectif et le plan détaillé de la séance en cours vivent dans `docs/methode/99_Prompt_de_reprise.md` (réécrit à chaque séance) — ne pas dupliquer cette info ici, elle est volatile et n'a pas sa place dans ce fichier stable.

## Contrat de collaboration (à respecter à chaque réponse)

- Expliquer chaque nouveau concept avant le code ; avancer par micro-étapes validées une par une.
- Fichiers complets uniquement — jamais de code en parcelle.
- Règle zéro invention : vérifier la doc officielle avant tout nom d'API/fonction.
- Ne jamais deviner l'orthographe d'un nom de fichier/dossier depuis un screenshot — demander à l'utilisateur de le taper explicitement.
- Ne jamais demander de screenshot exposant `.env`/`.env.local` — demander uniquement confirmation de présence d'une variable par son nom.
- Donner une recommandation justifiée (A/B/C + reco) à chaque choix structurant.
- Commits atomiques (jamais fix + feature mélangés, jamais deux features dans un commit) ; ne pas découper les enchaînements Git standards (add/commit/push).
- Build avant commit si du code est touché ; fail-fast avant push si lint/build/test est touché.
- Refuser toute tâche sans valeur métier claire.

## Repères documentaires

- `docs/methode/99_Prompt_de_reprise.md` — prompt de reprise de session, réécrit à chaque fin de séance.
- `docs/technique/decisions.md` — journal des décisions d'architecture (ADR, format `DT-LotX-NN`), rétrospectif et jamais réécrit (une décision dépréciée est marquée comme telle, jamais supprimée).
- `docs/technique/setup.md`, `docs/technique/deploiement.md` — setup local et déploiement.
