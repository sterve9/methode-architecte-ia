@AGENTS.md

# Méthode Architecte IA — Contexte projet

## Projet

- Nom : Méthode Architecte IA
- Repo : https://github.com/sterve9/methode-architecte-ia
- Emplacement local : `C:\Dev\02_Développement\methode-architecte-ia`
- Shell : Git Bash
- URL prod : https://methode-architecte-ia.vercel.app

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

## État d'avancement (dernier jalon : Lot 4 clos, 24/08/2026)

- Lots 0 à 4 **clos et tagués** : v0.1.0-lot0 (auth non incluse) → v0.2.0-lot1 (auth) → v0.4.0-lot2 (M1 complet) → v0.5.0-lot3 (M2 complet) → v0.6.0-lot4 (M3 preuves publiques). Prod sur Vercel.
- CI GitHub Actions : verte (cassée depuis S19 sur des erreurs ESLint dans le lot M3, corrigée en S20 — dernière vérification sur le commit `e58849f`).
- Modules implémentés : **M1 Projets**, **M2 Méthode** (chaque projet clone ses 13 étapes via une RPC Postgres transactionnelle `create_project_with_steps`), **M3 Preuves** (publication de livrables, vitrine `/p` et fiche `/p/[slug]`).
- Modules encore à l'état de coquille (`.gitkeep` seul) : M4 Diffusion, M5 Mesures, M6 Missions, M7 Consultation. Noter que `/p` et `/p/[slug]` (rôle normalement dévolu à M7) sont actuellement implémentés directement dans `src/app/p/` en consommant les queries de M3 — pas encore un module M7 séparé.
- **Décision DT-Lot4-04** : le Lot 5 est mis en pause. Constat en fin de Lot 4 : la valeur perçue de la vitrine publique restait floue tant que l'UX est brute et les données factices.

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
