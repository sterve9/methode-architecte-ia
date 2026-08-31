REPRISE SESSION — MÉTHODE ARCHITECTE IA — SÉANCE 25 (S25)
LE MVP EST CLOS — QUE PRODUIT-ON MAINTENANT ?
═══════════════════════════════════════════════════════════════

ℹ️ Ce fichier ne décrit QUE ce qui est propre à la séance en cours
(bilan de la précédente + objectif + plan). Le contexte stable du
projet — rôle, règles de collaboration, architecture, état d'avancement
figé par lot — vit dans CLAUDE.md à la racine du dépôt et n'est plus
répété ici.

═══════════════════════════════════════════════════════════════
📌 BILAN SÉANCE PRÉCÉDENTE (S24)
═══════════════════════════════════════════════════════════════

Le plan annoncé (étapes 0 à 3) a été exécuté, sauf l'étape 3 — remplacée
en cours de route par un chantier non prévu : le domaine propre.

── LE MVP EST TERMINÉ — tag `v1.0.0-mvp` ──

13 commits, CI verte sur `9a1ca81`. Les 7 conditions de sortie de
`11.Plan_Implementation.md` §7 sont satisfaites **et mesurées une par une**,
pas déduites de l'existence des tags.

Bilan des cases : **50 cochées sur 51**.

La 51ᵉ reste vide **volontairement, et pour toujours** : « Aucun lot livré
sans respecter les règles de mise à jour applicables » est historiquement
faux — RM-01 a été enfreinte aux lots 2, 3 et 4, et aucune réparation ne
rend cette condition vraie rétroactivement. Elle porte sa note en dessous.
**Ne pas la cocher lors d'une future relecture.**

── Décision de méthode : RM-03 précisée (révision explicite) ──

Cocher une condition de sortie est un **constat d'avancement**, pas une
révision de méthode. Deux verrous encadrent l'ouverture :

1. Seul le caractère de la case change. **Toucher un mot d'un critère
   relève de RM-03**, sans discussion.
2. Une case ne se coche que **contre une mesure effectuée et nommée au
   moment où on coche**, jamais contre une conviction.

Le verrou 1 a été vérifié par diff normalisé sur `11` et `12` : aucune
ligne n'a bougé en dehors des cases.

── Trois défauts trouvés EN MESURANT, invisibles à la relecture ──

1. **`export const revalidate = 60` est inerte** sur `/p` et `/p/[slug]`.
   Ces pages appellent `createClient()` → `cookies()`, ce qui les bascule
   en rendu dynamique. Le build le dit : `ƒ (Dynamic)`. La doc utilisateur
   annonçait un délai de cache qui n'existe pas — corrigé.
   ⚠️ **La déclaration morte est toujours dans le code** (angle mort n°7).

2. **`signOut()` est global par défaut** : se déconnecter révoque les
   jetons de TOUS les appareils. Personne ne l'avait décidé. C'est
   désormais un choix assumé (`DT-Lot5-10`), écrit dans le guide utilisateur.
   Conséquence technique : `workers: 1` devient inconditionnel dans
   `playwright.config.ts` — avec un seul compte, deux specs authentifiées
   en parallèle se coupent la session mutuellement.

3. **`06.Composants.md` contredisait bien M4** — angle mort resté
   « NON VÉRIFIÉ » pendant des séances. La fiche C4 décrivait une diffusion
   automatisée avec objet `Canal de diffusion` et historisation. Révisée
   sous RM-03, en citant `DT-Lot5-04` : le pivot était décidé **avant**
   l'implémentation, la doc rattrape une décision antérieure — elle ne
   justifie pas après coup.

── Deux critères du Lot 1 enfin mesurés ──

`e2e/session.spec.ts` couvre la persistance de session après rechargement
et la déconnexion effective. **Éprouvés par mutation** : neutraliser
`signOut()` fait tomber le test sur l'assertion visée. Le test de
persistance, lui, a réellement échoué avant `workers: 1` — ça vaut
démonstration. Suite E2E : **8 → 10 tests**.

── Le domaine propre : `https://methode.sterveshop.cloud` ──

`DT-Lot5-11` **rend caduque `DT-Lot0-06`** (« pas de domaine custom »).
Branché par CNAME chez Hostinger + TXT `_vercel` de preuve de propriété,
le domaine étant déjà revendiqué par un autre compte Vercel (`dashboard`,
`boutique`). **La délégation des serveurs de noms à Vercel a été refusée** :
elle aurait emporté le VPS, la messagerie et deux autres projets.

L'ancienne `.vercel.app` renvoie un **308 permanent** vers la nouvelle.

Au passage, `DT-Lot4-03` promettait une migration sans modification de code.
Elle ne l'était qu'à moitié : `p/[slug]/page.tsx` portait l'URL **en dur**,
et une fiche servie sur le nouveau domaine annonçait encore l'ancien dans
son `og:url`. Les deux implémentations sont fusionnées dans
`resolveSiteUrl()` (`src/lib/site-url.ts`).

Mesuré après coup : un ancien lien de preuve suit le 308 et arrive en 200
sur le nouveau domaine, **slug identique**. `DT-Lot4-03` (aucune URL absolue
en base) est validée sur le terrain.

── Ménage de sécurité ──

Le PAT GitHub de la S22 est **révoqué**, ainsi qu'une seconde clé morte
(`VPS-git-pull-sterveshop`). `git fetch` vérifié après coup : rien cassé.
La clé `ai-automation-skills-audit`, vivante, a été laissée intacte.

`Site URL` de Supabase était resté sur `http://localhost:3000` **depuis le
premier jour** — un lien de réinitialisation de mot de passe aurait été
injoignable depuis un autre appareil. Corrigé, et vérifié par rechargement.

═══════════════════════════════════════════════════════════════
🎯 OBJECTIF S25 — PREMIER PROJET NEUF, LES 13 ÉTAPES EN DIRECT
═══════════════════════════════════════════════════════════════

Projet : **diffusion multi-canal d'une preuve**. Nouveau dépôt à créer,
proposition de nom `studio-diffusion`, voisin de ce dépôt.

── Le plan a changé en fin de S24, et pourquoi ──

`outil-trading-stephane` était retenu. Abandonné au profit d'un projet NEUF,
sur demande explicite : dérouler les 13 étapes **dans le bon ordre, en
direct**, plutôt que de les reconstituer sur un projet déjà construit.
C'est le test honnête de la méthode, pas seulement du système.

Le MVP lui-même reste écarté comme sujet, pour la raison structurelle
inchangée : cocher 13 étapes en une soirée fabriquerait une fausse cadence.

── Le problème métier, DÉJÀ MESURÉ ──

Relevé sur la vidéo TikTok la plus performante, le 31/08/2026 :

| Mesure | Valeur |
|---|---|
| Vues | 425 |
| Temps de visionnage moyen | 34,5 s |
| Part moyenne de la vidéo regardée | **21 %** |
| Vidéo vue en entier | 8,32 % |
| Décrochage massif | **à 0:02** |
| Nouveaux abonnés | 5, soit **~1,18 %** |
| Total compte | 16 vidéos → 30 abonnés |

Durée de la vidéo **déduite** (34,5 / 0,21) : **~2 min 45**. ⚠️ Non confirmé
par lecture directe — à vérifier en début de séance.

**Deux causes identifiées, une seule visible :**

1. **Le hook.** Le public part à 2 secondes, avant tout contenu. TikTok lit
   cet abandon comme un verdict et cesse de distribuer.
2. **La durée, invisible.** À contenu identique, 34,5 s regardées font 21 %
   sur 2 min 45, mais **77 % sur 45 s**. Le format transforme une attention
   correcte en mauvais bulletin.

**Ce qui n'est PAS le problème : la conversion.** ~1 % d'abonnement, c'est
sain. Ceux qui regardent suivent. Trop peu de gens regardent.

Arithmétique de l'objectif : à ~1 %, 1000 abonnés ≈ **100 000 vues
cumulées**. À 425 vues/vidéo → plus de 200 vidéos. À 5 000 → une vingtaine.
**Le levier est la portée par vidéo, pas le nombre de vidéos.**

── Le trou dans le système, qui justifie le projet ──

M4 Diffusion ne sait produire que du **texte, pour LinkedIn et X**. Or le
canal réel est la **vidéo** : une série TikTok qui raconte la construction
de `crm-prospection-ingrid`, étape par étape (au 31/08 : l'objet central).

Répartition naturelle des canaux, à valider :

- **YouTube** — l'explication complète. C'EST la preuve. Chaîne créée, VIDE.
- **TikTok** — 45 s, un angle, renvoi vers la version longue.
- **LinkedIn** — le texte + les liens. Publication irrégulière aujourd'hui.

Objectifs déclarés : court terme, vendre un produit digital (boutique
Chariow) ; moyen terme, accumuler des preuves → petites missions →
consolider la compétence → poste d'AI automation specialist.
⚠️ Tension assumée : l'audience du produit et celle des missions ne sont pas
la même. La crédibilité précède la vente.

═══════════════════════════════════════════════════════════════
📋 PLAN DE TRAVAIL S25 (à valider en début de séance)
═══════════════════════════════════════════════════════════════

Étape 0 — Niveau d'énergie & calibrage. Confirmer la durée réelle de la
          vidéo analysée (déduction non vérifiée). Créer le dépôt.

Étape 1 — Dérouler les étapes 1 à 4 de la méthode : Besoin Client,
          Problème Métier, Objets Métier, Objet Central. En direct, dans
          l'ordre, sans anticiper la solution.

Étape 2 — Créer le projet dans le système sur
          https://methode.sterveshop.cloud, attacher les livrables produits,
          terminer les étapes AU FUR ET À MESURE — jamais en rafale.

Étape 3 — Relever les frictions du système au fil de l'eau.

⚠️ **Ne pas décider l'architecture avant l'étape 8.** La question « le code
atterrit-il dans M4, ou dans une application séparée qui consomme les
preuves par contrat ? » est prématurée et doit le rester.

── En parallèle, hors séance : la correction gratuite ──

Sur les 5 prochaines vidéos : **45 secondes, hook réécrit, version longue
sur YouTube.** Ce n'est pas une distraction — c'est ce qui alimentera
l'étape 2 en données fraîches. Si la rétention passe de 21 % à 60 %, la
cause est prouvée au lieu d'être supposée.

Où trouver les chiffres : profil → menu ☰ → Outils de créateur →
**TikTok Studio** → onglet **Contenu** (courbe de rétention seconde par
seconde). Pas dans « Paramètres et confidentialité ».

═══════════════════════════════════════════════════════════════
💡 PISTES OUVERTES, NON PRIORITAIRES
═══════════════════════════════════════════════════════════════

- **Formaliser M7 Consultation** : `/p`, `/p/[slug]` et `/dashboard/mesures`
  consomment M3 et M5 directement depuis `src/app/`. Entorse connue à CA-06,
  contrat CT-09 déjà écrit, chantier débloqué.
- **Instrumenter les autres transitions de projet** : écart connu avec CT-04
  (voir `DT-Lot5-09`), à combler par migration additive `from_status` /
  `to_status`.
- **`UpdateProofInput` est déclaré mais importé nulle part** : une preuve
  publiée ne peut être ni corrigée ni renommée, seulement retirée. Manque
  produit réel, non bloquant.
- M4 : un second canal, ou un choix de ton à la génération.
- La génération de posts reste **volontairement hors CI** (appel payant à
  chaque push). Ne pas l'y ajouter sans décision explicite.

═══════════════════════════════════════════════════════════════
🕳️ ANGLES MORTS CONNUS EN FIN DE S24
═══════════════════════════════════════════════════════════════

✅ RÉSOLUS EN S24 — `docs/utilisateur.md` (écrit), `06.Composants.md`
   (révisé), le PAT GitHub (révoqué), et deux critères du Lot 1 (mesurés).

── Dettes documentaires ──

1. `docs/technique/architecture.md` §2 décrit encore la dette d'alias
   tsconfig de `DT-Lot1-03` comme ouverte, alors que `tsconfig.json` mappe
   bien `@/*` → `./src/*`. **La dette est réglée, sa clôture n'a jamais été
   tracée.** Repéré en S22, toujours pas traité — c'est désormais le plus
   ancien point ouvert du dépôt.

── Angles morts techniques ──

2. **L'isolation des données entre utilisateurs ne peut pas être mesurée** :
   un seul compte existe (`DT-Lot1-01`), donc aucun projet d'un autre
   utilisateur à tenter d'atteindre. Les policies RLS ont été **relues**,
   pas éprouvées. Inscrit dans `tests.md` §5. **À refaire le jour où un
   second compte existera.**

3. **La table `events` ne contient QUE des données de test.** Les 3 projets
   réels sont antérieurs. `/dashboard/mesures` sans `?tests=1` affiche 0
   partout, et c'est correct. **Ne pas prendre ce zéro pour une panne.**

4. Chaque exécution du test E2E ajoute **4 événements non supprimables** en
   production (journal append-only). Écartés à la lecture sur le préfixe
   `[E2E]`, jamais de la base.

5. Un projet de test est resté au statut `Idée` au lieu d'`Archivé` :
   `[E2E] Chaîne critique 1788032168183`, vestige d'un run interrompu.

6. Le refresh de session **après expiration réelle du jeton** n'est
   toujours pas couvert. `session.spec.ts` prouve la survie à un
   rechargement immédiat, pas au renouvellement effectif. Premier suspect
   en cas de déconnexion inattendue.

7. **`export const revalidate = 60` est du code mort** dans `/p` et
   `/p/[slug]` : les pages sont dynamiques, la déclaration n'a aucun effet.
   Elle a déjà induit une erreur en doc. **Soit la retirer, soit rendre les
   pages réellement statiques** — mais ne pas la laisser mentir.

8. La génération de posts n'a été éprouvée que sur **deux** preuves, dont
   une factice issue du test E2E.

── Hors périmètre de ce dépôt, mais réel ──

9. **Le VPS `sterveshop` tirait du code avec une clé morte depuis le
   11 juillet 2026.** Sa clé (`VPS-git-pull-sterveshop`) a été supprimée en
   S24. Si ce VPS fait des `git pull` automatiques, ils échouent en silence
   depuis des semaines. Autre projet, mais à traiter.

10. Le `TXT _vercel` de vérification pourrait être retiré maintenant que le
    domaine est validé (Vercel l'indique). Sans urgence — et **ne jamais
    toucher à celui de `dashboard`**, qui vit sous le même nom.

═══════════════════════════════════════════════════════════════
🧭 LEÇON DE LA S24, TRANSPOSABLE
═══════════════════════════════════════════════════════════════

Trois fois dans la même séance, un affichage a affirmé quelque chose que la
réalité ne confirmait pas :

- le code déclarait `revalidate = 60` — sans aucun effet ;
- Vercel affichait « Valid Configuration » — avant toute vérification réelle ;
- Supabase montrait la bonne valeur dans son champ — sans qu'elle soit
  forcément enregistrée.

Chaque fois, la même parade : **aller chercher la preuve ailleurs que là où
l'affirmation est faite.** Le build plutôt que le fichier source. Un `curl`
plutôt que le tableau de bord. Un rechargement de page plutôt que le
formulaire rempli.

La S22 avait appris qu'un fichier correct ne prouve pas un comportement ;
la S23, qu'une suite verte ne prouve pas une couverture. La S24 ajoute :
**un écran qui dit « c'est bon » n'est pas une mesure.**

Corollaire conservé de la S23 : après avoir écrit un test, le casser
volontairement pour vérifier qu'il échoue. Appliqué en S24 sur
`session.spec.ts`, et ça a servi.

═══════════════════════════════════════════════════════════════
FIN DU PROMPT DE REPRISE S25
