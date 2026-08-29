REPRISE SESSION — MÉTHODE ARCHITECTE IA — SÉANCE 24 (S24)
DERNIER VERROU DU MVP — docs/utilisateur.md
═══════════════════════════════════════════════════════════════

ℹ️ Ce fichier ne décrit QUE ce qui est propre à la séance en cours
(bilan de la précédente + objectif + plan). Le contexte stable du
projet — rôle, règles de collaboration, architecture, état d'avancement
figé par lot — vit dans CLAUDE.md à la racine du dépôt et n'est plus
répété ici.

═══════════════════════════════════════════════════════════════
📌 BILAN SÉANCE PRÉCÉDENTE (S23)
═══════════════════════════════════════════════════════════════

Séance longue. Le plan annoncé (étapes 0 à 4) a été exécuté en entier,
puis étendu d'un chantier que l'audit final a rendu nécessaire.

── Le Lot 5 est OUVERT ET CLOS — tag `v0.7.0-lot5` ──

Le dernier lot du MVP est livré. Périmètre tenu, sans extension :

- Table `events` (migration `20260829233704_create_events_table.sql`),
  appliquée à la main dans le SQL Editor Supabase — il n'y a toujours ni CLI
  Supabase ni `psql` sur la machine, et `.env.local` ne porte que la clé
  `anon`. **Toute future migration passera par le même geste manuel.**
- Module `m5-mesures` : `recordEvent()` est le seul point d'écriture.
- Les 4 événements clés émis depuis les Server Actions existantes.
- Consultation interne sur `/dashboard/mesures`.
- ADR `DT-Lot5-09` (modèle du journal) et `DT-Lot5-08` (outillage GitHub).

Trois choix de conception à ne pas rouvrir sans raison nouvelle :

1. **Référence polymorphe assumée** : `source_id UUID` sans FK, qualifié par
   `source_type` sous CHECK. Une FK ne peut viser qu'une table, or les 4
   événements pointent vers 4 tables. La cohérence du couple est tenue côté
   applicatif par `sourceTypeForEvent()`. `project_id` est une vraie FK.
2. **Journal append-only** : aucune policy UPDATE, aucune policy DELETE. Un
   journal réécrivable ne vaut rien comme mesure.
3. **`recordEvent()` n'est PAS une Server Action** (pas de `'use server'`) et
   **ne lève jamais**. La marquer `'use server'` en ferait un point d'entrée
   réseau, donc un moyen de forger des événements. Et l'instrumentation
   observe la chaîne de valeur, elle ne la commande pas.

── La leçon de la S22 a été appliquée, pas récitée ──

Rien n'a été déclaré sur la foi du code. Deux mesures réelles :

- **Frontière publique, sur l'API REST Supabase hors application** : `anon`
  refusé en **lecture ET en écriture** (`42501 permission denied`), authentifié
  en 200. Le refus tombe au niveau du GRANT, donc avant même la RLS.
- **Écriture effective** : 3 passages de la chaîne critique (1 local, 2 depuis
  la CI) → **12 événements, exactement 4 par run**, même ordre à chaque fois,
  relus directement en base. L'instrumentation est reproductible et fonctionne
  aussi depuis l'environnement déployé.

── L'audit des conditions de sortie du MVP a trouvé un vrai trou ──

Sur les 7 conditions de `11.Plan_Implementation.md` §7, **6 sont désormais
satisfaites**. La découverte : `12.Strategie_Tests.md` §8 impose des tests
unitaires de domaine à chaque lot, et **trois lots avaient été tagués sans
les leurs** — lots 2, 3 et 4, plus le lot 1. Les 30 tests verts couvraient
bien, mais pas là.

Comblé dans la foulée : **30 → 127 tests unitaires**. Les matrices attendues
sont recopiées depuis `05.Cycle_de_Vie.md` **sans importer les tables du code
testé**, sinon les tests se valideraient eux-mêmes. Vérifié par mutation :
altérer la seule transition `Idée → Livré` fait tomber 3 tests.

`isPublicPath` a été **exportée** de `src/lib/supabase/middleware.ts` pour
cela — c'est l'allowlist qui décide de ce qui est public, elle ne devait pas
dépendre du seul E2E.

Seconde exigence du §9 traitée aussi : `docs/technique/tests.md` §5 liste
maintenant les **6 zones non testées automatiquement** et le risque assumé
pour chacune.

── Étape 0 : le MCP github est abandonné (DT-Lot5-08) ──

La réparation à froid de la S22 avait tenu (entrée propre, aucun secret), mais
la connexion échoue pour une raison **nouvelle** : le serveur ne propose pas
l'enregistrement dynamique de client attendu pour ouvrir l'OAuth. Rien qui se
règle côté dépôt. Décision : ne pas insister, l'API GitHub anonyme reste le
canal de lecture de la CI. Le fichier `.bak` qui contenait le PAT en clair a
été **supprimé**.

État technique en fin de séance : lint, build, **127 tests unitaires**,
**8 tests E2E** verts. CI verte sur `8e9da07`. Production vérifiée
(`/dashboard/mesures` en 307 → `/login` en anonyme, vitrine toujours en 200).

═══════════════════════════════════════════════════════════════
🎯 OBJECTIF S24 — ÉCRIRE docs/utilisateur.md ET CLORE LE MVP
═══════════════════════════════════════════════════════════════

**Il reste UNE condition de sortie du MVP sur sept.** Aucune ne relève
d'un lot restant : tous les lots sont livrés et tagués.

Condition n°7 (`13.Documentation.md` §9) : `docs/utilisateur.md` doit exister
et couvrir les parcours clés. **Ce fichier n'a jamais été écrit, à aucun lot.**
La règle RM-01 a donc été enfreinte à plusieurs reprises. C'est la dette
documentaire la plus ancienne du projet.

Les 8 parcours à couvrir :

1. Se connecter
2. Créer un projet
3. Suivre les étapes de la méthode
4. Attacher un livrable à une étape
5. Publier un livrable
6. Transformer un livrable en preuve publique
7. Retirer une preuve de la vitrine
8. Générer un post de diffusion depuis une preuve

⚠️ **Ne rien inventer** : `e2e/chaine-critique.spec.ts` parcourt réellement
les 7 premiers et cite les libellés exacts des boutons et des champs. C'est la
source la plus fiable de ce que l'interface fait vraiment. Le parcours 8 est
couvert par `/dashboard/diffusion`.

═══════════════════════════════════════════════════════════════
📋 PLAN DE TRAVAIL S24
═══════════════════════════════════════════════════════════════

Étape 0 — Révoquer le PAT GitHub sur github.com/settings/tokens (geste resté
          en suspens, voir angle mort n°8). Puis niveau d'énergie & calibrage.

Étape 1 — Écrire `docs/utilisateur.md`, les 8 parcours.
          Public visé : l'utilisateur unique dans six mois, pas un développeur.
          Ce n'est pas de la doc technique : `docs/technique/` couvre déjà ça.

Étape 2 — Re-vérifier les 7 conditions de `11.Plan_Implementation.md` §7 une
          par une, puis **déclarer le MVP terminé et poser le tag**.
          ⚠️ Question à trancher explicitement à ce moment : les cases à cocher
          des fichiers méthode (`11` §7, `12` §9, `13` §9) n'ont **jamais** été
          cochées, y compris pour des conditions désormais satisfaites. Les
          cocher relève-t-il de RM-03 (révision de méthode explicite) ou du
          simple constat d'avancement ? Décider une fois pour toutes.

Étape 3 — Décider de l'après-MVP. Le premier projet de démonstration de la
          méthode, c'est ce système : le MVP terminé est lui-même une preuve
          publiable. À trancher : est-ce la prochaine preuve à produire ?

═══════════════════════════════════════════════════════════════
💡 PISTES OUVERTES, NON PRIORITAIRES
═══════════════════════════════════════════════════════════════

- Formaliser M7 Consultation : `/p` et `/p/[slug]` vivent toujours dans
  `src/app/p/` en consommant M3 directement (entorse connue à CA-06). Le
  contrat CT-09 existe, le chantier est débloqué. **`/dashboard/mesures`
  consomme M5 de la même façon** — même entorse, même chantier.
- Instrumenter les autres transitions de projet (écart connu avec CT-04, voir
  DT-Lot5-09) : ajouter `from_status`/`to_status` en migration additive.
- M4 : un second canal ou un choix de ton au moment de générer.
- La génération de posts est volontairement hors CI (appel payant à chaque
  push). Ne pas l'y ajouter sans décision explicite.

═══════════════════════════════════════════════════════════════
🕳️ ANGLES MORTS CONNUS EN FIN DE S23
═══════════════════════════════════════════════════════════════

✅ RÉSOLU EN S23 — l'ancien angle mort « aucune vérification que les règles
minimales de tests par lot sont appliquées » : audit fait, 4 lots comblés,
127 tests, zones non testées listées dans `tests.md` §5.

── Dettes documentaires ──

1. `docs/utilisateur.md` N'EXISTE TOUJOURS PAS. **C'est l'objet de la S24**
   et le dernier verrou du MVP.

2. `06.Composants.md` n'a toujours PAS été relu depuis l'implémentation de M4
   en diffusion assistée. Rien ne prouve qu'il y a une contradiction — rien ne
   prouve l'inverse non plus. Point NON VÉRIFIÉ. Toute correction relève de
   RM-03.

3. `docs/technique/architecture.md` §2 décrit encore la dette d'alias tsconfig
   de DT-Lot1-03 comme ouverte, alors que `tsconfig.json` mappe bien `@/*` →
   `./src/*`. **La dette est réglée, sa clôture n'a jamais été tracée.**
   Repéré en S22, toujours pas traité.

── Angles morts techniques ──

4. **La table `events` ne contient QUE des données de test.** Les 3 projets
   réels sont antérieurs à la table et ne produiront jamais d'événement
   rétroactivement. Conséquence : `/dashboard/mesures` sans `?tests=1` affiche
   **0 partout**, et c'est correct. La cadence réelle démarrera au prochain
   projet réel. **Ne pas prendre ce zéro pour une panne.**

5. Chaque exécution du test E2E ajoute **4 événements non supprimables** en
   production (journal append-only, DT-Lot5-09). Ils sont écartés à la lecture
   sur le préfixe `[E2E]`, jamais de la base. À surveiller si le volume devient
   gênant — la seule sortie serait une purge manuelle en SQL Editor.

6. Un projet de test est resté au statut `Idée` au lieu d'`Archivé` :
   `[E2E] Chaîne critique 1788032168183`, vestige d'un run interrompu.
   Sans conséquence (sa preuve est archivée), mais il traîne.

7. `UpdateProofInput` (`m3-preuves/types.ts`) est déclaré mais importé nulle
   part : une preuve publiée ne peut être ni corrigée ni renommée, seulement
   archivée. Non bloquant, mais c'est un manque produit réel.

8. **Le PAT GitHub n'a pas encore été révoqué** sur github.com/settings/tokens.
   Il est déjà rejeté par GitHub et le fichier `.bak` qui le contenait a été
   supprimé, mais la révocation reste le geste propre. Premier geste de la S24.

9. La génération de posts n'a été éprouvée que sur DEUX preuves, dont une
   factice issue du test E2E. Le prompt est isolé dans
   `m4-diffusion/domain/build-post-prompt.ts`, modifiable sans toucher au reste.

10. Le refresh de session Supabase par le proxy tourne depuis le Lot 5
    seulement. Vérifié en anonyme, mais la navigation CONNECTÉE au long cours
    n'a toujours pas été éprouvée. Premier suspect en cas de déconnexion ou de
    cookie qui saute.

═══════════════════════════════════════════════════════════════
🧭 LEÇON DE LA S23, TRANSPOSABLE
═══════════════════════════════════════════════════════════════

Trois lots tagués, une CI verte à chaque push, et trois règles minimales de la
stratégie de tests jamais appliquées. Personne ne l'a vu pendant quatre lots
parce que la suite était verte — elle testait simplement autre chose.

Un tag ne prouve que ce qu'on a pensé à vérifier. La S22 avait appris qu'un
fichier correct ne prouve pas un comportement ; la S23 ajoute qu'une suite
verte ne prouve pas une couverture. Dans les deux cas, le remède est le même :
relire le critère écrit, et aller mesurer.

Corollaire pratique adopté en S23 : après avoir écrit un test, **le casser
volontairement** (muter le code testé) pour vérifier qu'il échoue. Un test qui
ne peut pas échouer est un faux vert qui coûtera trois séances à découvrir.

═══════════════════════════════════════════════════════════════
FIN DU PROMPT DE REPRISE S24
