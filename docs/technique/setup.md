# Setup — Installation locale du projet

Ce document explique comment installer et faire tourner **Méthode Architecte IA** en local, à partir d'un repo fraîchement cloné.

Public visé : moi-même dans 6 mois, ou toute personne (ou IA) à qui je donne accès au projet.

---

## 1. Prérequis

### Logiciels à installer

| Logiciel | Version minimale | Vérification |
|---|---|---|
| **Node.js** | 20.x (LTS) | `node --version` |
| **npm** | 10.x (fourni avec Node 20) | `npm --version` |
| **Git** | 2.40+ | `git --version` |
| **Un éditeur de code** | VS Code recommandé | — |

⚠️ **Important** : le projet est calé sur **Node 20**, aussi bien en local qu'en CI (GitHub Actions) qu'en prod (Vercel). Ne pas utiliser Node 18 ou 22 pour éviter les différences de comportement.

### Comptes externes nécessaires

- **GitHub** : accès en lecture au repo `sterve9/methode-architecte-ia`
- **Supabase** : accès au projet `methode-architecte-ia` (organisation `Methode Architecte`)
- **Vercel** : accès au projet `methode-architecte-ia` (scope `sterve`) — uniquement si tu dois toucher au déploiement

### Shell recommandé

**Git Bash** sous Windows. Toutes les commandes de ce document supposent Git Bash.

---

## 2. Cloner le repo

```bash
cd C:/Dev/02_Développement
git clone https://github.com/sterve9/methode-architecte-ia.git
cd methode-architecte-ia
Vérifier que tu es bien sur la branche main :

Bash

git branch
Résultat attendu : * main

3. Installer les dépendances
Bash

npm ci
⚠️ Utiliser npm ci et non npm install : npm ci respecte strictement le package-lock.json, ce qui garantit exactement les mêmes versions qu'en CI et en prod.

Durée : environ 1 à 2 minutes.

Vérification : un dossier node_modules/ doit apparaître à la racine.

4. Configurer les variables d'environnement
Créer le fichier .env.local
À la racine du projet, créer un fichier .env.local avec la structure suivante :

text

NEXT_PUBLIC_SUPABASE_URL=https://tegcvrdejkwysrtxdvnx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<clé_publique_anon_supabase>
ANTHROPIC_API_KEY=<clé_secrète_anthropic>
E2E_USER_EMAIL=<email de l'utilisateur unique de l'app>
E2E_USER_PASSWORD=<mot de passe de ce compte>
⚠️ ANTHROPIC_API_KEY est un secret serveur (génération des posts M4, voir DT-Lot5-04) : jamais préfixé NEXT_PUBLIC_, jamais commité. Obtenu sur console.anthropic.com → Settings → API keys.
E2E_USER_EMAIL / E2E_USER_PASSWORD servent au test E2E (voir tests.md). Sans eux, le test est ignoré et non échoué.
Où récupérer les clés
Les valeurs de ces variables sont stockées dans mon gestionnaire de mots de passe Google (compte sterve).

Si tu n'y as pas accès :

Soit tu me demandes les clés directement
Soit tu récupères ces valeurs dans la console Supabase : Project Settings → API
⚠️ Ne jamais commit .env.local : le fichier est déjà dans .gitignore.

5. Lancer le serveur de développement
Bash

npm run dev
Ouvrir dans le navigateur : http://localhost:3000

Résultat attendu : la page d'accueil Next.js s'affiche sans erreur dans la console.

Pour arrêter : Ctrl + C dans le terminal.

6. Lancer les tests
Tests unitaires et composants (Vitest)
Bash

npm test
Vitest scanne le dossier __tests__/ et tous les fichiers *.test.ts ou *.test.tsx du projet, en excluant node_modules, dist, .next et e2e/**.

Résultat attendu : tous les tests passent (au minimum le test factice __tests__/smoke.test.ts).

Tests end-to-end (Playwright)
Bash

npm run test:e2e
Playwright lance un navigateur headless et exécute les scénarios du dossier e2e/.

⚠️ Au premier lancement, Playwright peut demander à télécharger les navigateurs. Si c'est le cas :

Bash

npx playwright install
7. Vérifier le build de production
Avant tout commit qui touche au code, toujours valider en local :

Bash

npm run build
Résultat attendu : Compiled successfully en quelques secondes, sans erreur ni warning bloquant.

Ce build est exactement celui qui tourne en CI (GitHub Actions) et en prod (Vercel). S'il passe en local, il passera en CI.

8. Résumé — les 3 commandes CI
Avant chaque push, exécuter les 3 commandes que la CI exécutera :

Bash

npm run lint
npm run build
npm test
Si les 3 passent en local, la CI passera aussi (règle Fail Fast avant Push).

En cas de problème
Consulter les documents :

decisions.md — décisions techniques figées et leur pourquoi
deploiement.md — fonctionnement de la CI et du déploiement Vercel
