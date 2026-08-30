# Guide d'utilisation — Méthode Architecte IA

**Pour qui** : toi, utilisateur du système, y compris dans six mois après une
longue absence. Ce guide explique **comment faire les choses**, pas comment
elles sont construites.

- Comment le système est fait → `docs/technique/`
- Pourquoi la méthode est ainsi → `docs/methode/`

---

## 1. Se repérer en trente secondes

Le système a **deux faces** :

| Face | Adresse | Qui y accède |
|---|---|---|
| Vitrine publique | `/p` et `/p/<slug>` | Tout le monde, sans compte |
| Espace personnel | `/dashboard` et tout ce qui est en dessous | Toi seul, connecté |

En production : <https://methode.sterveshop.cloud>

L'ancienne adresse `methode-architecte-ia.vercel.app` redirige vers celle-ci :
tes anciens liens partagés continuent de fonctionner.

Toute adresse commençant par `/dashboard` renvoie vers `/login` si tu n'es pas
connecté. C'est voulu : rien de privé n'est atteignable sans session.

### Le vocabulaire, dans l'ordre où il sert

La chaîne de valeur va toujours dans ce sens, et jamais dans l'autre :

**Projet** → **Étape** → **Livrable** → **Preuve publique** → **Post de diffusion**

- Un **Projet** est une unité de travail concrète qui applique la méthode à un
  problème réel.
- Une **Étape** est l'une des 13 étapes de la méthode. Elles sont créées
  automatiquement à la naissance du projet — tu n'as jamais à les saisir.
- Un **Livrable** est une URL vers quelque chose de réel (un repo, un Figma,
  un document), rattachée à une étape.
- Une **Preuve publique** est un livrable raconté pour un lecteur extérieur, et
  publié sur la vitrine.
- Un **post de diffusion** est un brouillon de publication tiré d'une preuve.

Chaque maillon suppose le précédent : on ne publie pas une preuve sans livrable
publié, on ne rattache pas un livrable sans étape.

---

## 2. Se connecter

1. Va sur `/login`.
2. Remplis **Email** et **Mot de passe**.
3. Clique **Se connecter**.

Tu arrives sur `/dashboard`, qui affiche l'adresse du compte connecté et quatre
raccourcis : mes Projets, générer un post, journal des mesures, portfolio public.

**Il n'y a pas d'écran d'inscription.** Le système a un seul utilisateur, créé
directement dans Supabase. Si tu perds ton mot de passe, il se réinitialise
depuis la console Supabase, pas depuis l'application.

Pour te déconnecter : bouton **Se déconnecter**, en bas de `/dashboard`.

⚠️ **La déconnexion vaut pour tous tes appareils à la fois.** Te déconnecter
sur ton ordinateur ferme aussi ta session sur ton téléphone. C'est voulu : ton
compte unique commande tout ce qui est publié, donc « me déconnecter » veut
dire partout. Si tu veux juste fermer l'onglet, ferme-le — ne clique pas.

Si tu te retrouves sur `/login` alors que tu te croyais connecté, ta session a
expiré : reconnecte-toi, rien n'est perdu.

---

## 3. Créer un projet

1. Depuis `/dashboard`, clique **📁 Accéder à mes Projets**, puis
   **+ Nouveau projet**. (Adresse directe : `/dashboard/projects/new`.)
2. Renseigne **Nom du projet**.
3. Renseigne **Problème métier traité** — le problème réel que ce projet vise à
   résoudre. Les deux champs sont obligatoires.
4. Clique **Créer le projet**.

Tu es renvoyé sur la liste des projets. Le nouveau projet y figure au statut
**Idée**, et **ses 13 étapes ont été créées d'un coup**, toutes au statut
*À faire*.

Prends le temps sur le champ *Problème métier* : c'est lui qui te rappellera,
dans six mois, pourquoi ce projet existait.

---

## 4. Suivre les étapes de la méthode

Clique sur un projet dans la liste pour ouvrir sa page. Tu y vois son statut,
son problème métier, puis la section **Étapes de la Méthode (13)**.

Les 13 étapes, toujours dans cet ordre :

| # | Étape | # | Étape |
|---|---|---|---|
| 1 | Besoin Client | 8 | Architecture |
| 2 | Problème Métier | 9 | Choix Technos |
| 3 | Objets Métier | 10 | Justifications |
| 4 | Objet Central | 11 | Plan d'Implémentation |
| 5 | Cycle de Vie | 12 | Stratégie de Tests |
| 6 | Composants | 13 | Documentation |
| 7 | Contrats | | |

### Faire avancer une étape

Chaque étape porte ses propres boutons :

- **Démarrer** — la passe de *À faire* à *En cours*.
- **Terminer** — la passe de *En cours* à *Terminée*.
- **Remettre À faire** — annule un démarrage, tant que l'étape n'est pas terminée.

Deux règles à connaître, elles ne sont pas contournables :

- **Pas de saut direct.** Une étape *À faire* ne peut pas passer *Terminée* :
  il faut la démarrer d'abord.
- **Terminée est définitif.** Une étape terminée n'a plus aucun bouton. C'est
  volontaire — une étape qu'on peut rouvrir ne prouve rien.

### Faire avancer le projet lui-même

Le projet a son propre statut, indépendant des étapes. Il se change par le
bouton **Modifier** en bas de la page projet : choisis dans la liste **Statut**,
puis **Enregistrer**. La liste ne propose que les passages autorisés depuis le
statut courant.

Les chemins possibles :

```
Idée → Cadré → En cours ⇄ En pause
                  │           │
                  ▼           │
                Livré         │
                  │           │
                  ▼           ▼
                Archivé ◄─────┘
```

*En cours*, *En pause* et *Livré* mènent tous les trois à *Archivé*.

- **Idée** → Cadré → En cours : le démarrage normal, dans cet ordre.
- **En cours** ⇄ **En pause** : une pause se reprend.
- **Livré** : le travail est fait.
- **Archivé** : terminal. Un projet archivé ne revient jamais.

**Pour archiver**, le projet doit être *En cours*, *En pause* ou *Livré* — pas
*Idée* ni *Cadré*. Bouton **Archiver** en bas de la page projet, puis
**Raison de l'archivage** (obligatoire) et **Archiver définitivement**.
La raison reste affichée sur la fiche du projet.

Rien ne se supprime jamais dans ce système : on archive. C'est ce qui permet de
relire l'historique complet plus tard.

---

## 5. Attacher un livrable à une étape

Un livrable est **une URL** : le système ne stocke aucun fichier.

1. Sur la page du projet, repère l'étape concernée. Chaque étape a sa
   sous-section **Livrables**.
2. Clique **+ Ajouter un livrable (URL)**.
3. Remplis :
   - **Titre du livrable** (ex : Figma, Repo GitHub…) — obligatoire ;
   - l'**URL** (`https://…`) — obligatoire ;
   - une **description ou notes** — optionnel, mais utile : elle sert de point
     de départ au résumé si tu en fais une preuve publique plus tard.
4. Clique **Enregistrer**.

Le livrable apparaît sous l'étape, au statut **Brouillon**.

Un livrable est rattaché à **une seule étape**. Range-le sous celle qui l'a
réellement produit : c'est ce qui rendra l'historique lisible.

---

## 6. Publier un livrable

*Brouillon* et *Publié* sont deux états d'un livrable **à l'intérieur de ton
espace** — publier un livrable ne le rend pas public.

- Bouton **Publier** : le livrable passe *Brouillon* → *Publié*.
- Bouton **Dépublier** : il revient à *Brouillon*.

C'est réversible dans les deux sens, autant de fois que nécessaire.

**À quoi ça sert** : seul un livrable *Publié* peut devenir une preuve publique.
Le bouton **🌟 Preuve publique** n'apparaît que sur les livrables publiés. Le
passage par *Publié* est la déclaration que ce livrable est présentable.

---

## 7. Transformer un livrable en preuve publique

C'est le geste qui expose quelque chose au monde entier. Lis le résumé deux fois
avant de valider.

1. Sur un livrable au statut **Publié**, clique **🌟 Preuve publique**.
2. La fenêtre **🌟 Transformer en Preuve Publique** s'ouvre :
   - **Titre du Récit** — pré-rempli avec le titre du livrable, modifiable.
     C'est lui qui devient l'adresse publique de la preuve, donc écris-le pour
     un lecteur extérieur.
   - **Format de preuve** — au choix : *Récit de compétence*, *Cas d'usage*,
     *Livrable technique*, *Démonstrateur AI*.
   - **Résumé / Valeur apportée** — **obligatoire**. Pré-rempli avec la
     description du livrable si tu en avais mis une. C'est le texte qu'un
     visiteur lit en premier, et celui qui sert de matière au post de diffusion.
   - **Contexte & Méthodologie** — optionnel.
   - **Image de preuve** — optionnel, une URL d'image. Elle illustre la fiche
     et l'aperçu affiché lors d'un partage sur les réseaux.
3. Clique **Publier la preuve 🚀**.

La preuve est créée **et mise en ligne dans le même geste** : il n'y a pas
d'étape de relecture intermédiaire. Un lien **Voir /p/…** apparaît aussitôt —
c'est l'adresse publique définitive de cette preuve.

La preuve est alors visible par n'importe qui, sans compte, sur `/p` et sur sa
fiche `/p/<slug>`, avec ses boutons de partage LinkedIn et X.

**La mise en ligne est immédiate.** Les pages publiques sont recalculées à
chaque visite : ta preuve est consultable dès que tu as cliqué, sans délai de
cache. Si elle n'apparaît pas, cherche la cause ailleurs — pas dans un délai
d'attente.

---

## 8. Retirer une preuve de la vitrine

1. Va sur `/dashboard/diffusion` (raccourci **✍️ Générer un post depuis une
   preuve** sur le dashboard). La page liste **toutes** les preuves en ligne.
2. Sur la preuve concernée, clique **Retirer de la vitrine**.
3. Une confirmation apparaît, nommant la preuve. Clique **Confirmer**.

La preuve disparaît de la liste, de `/p`, et sa fiche `/p/<slug>` renvoie une
page introuvable.

⚠️ **Ce retrait est définitif.** Une preuve retirée est archivée, et l'archivage
est terminal : elle ne peut pas être remise en ligne. Pour la republier, il faut
refaire une preuve depuis le livrable.

⚠️ **Archiver un projet ne retire pas ses preuves de la vitrine.** Ce sont deux
gestes distincts. Si tu veux qu'un projet disparaisse complètement du public,
retire ses preuves ici *puis* archive le projet.

---

## 9. Générer un post de diffusion depuis une preuve

Le système **ne publie rien à ta place**. Il rédige un brouillon ; tu le relis,
tu le corriges, tu le copies, tu le publies toi-même.

1. Va sur `/dashboard/diffusion`.
2. Sur la preuve choisie, clique **Post LinkedIn** ou **Post X**.
3. Attends la rédaction (quelques secondes).
4. Le brouillon s'ouvre. **Chaque bloc est modifiable directement** dans la
   fenêtre, et a son propre bouton **Copier**.

Ce que tu obtiens selon le canal :

- **LinkedIn** — deux blocs : *1. Le post* (sans lien) et
  *2. Le premier commentaire* (qui contient le lien). Poste le premier, puis
  ajoute le second en commentaire juste après. Le lien est sorti du corps du
  post parce que LinkedIn réduit la portée des publications qui en contiennent un.
- **X** — un seul bloc, avec un compteur de caractères. Il passe en rouge
  au-delà de **280 caractères** : au-dessus, X refusera la publication. Coupe
  dans le texte avant de copier.

Ferme la fenêtre avec **Fermer**. **Le brouillon n'est pas conservé** : si tu
le fermes sans copier, il est perdu et il faudra le regénérer.

Corrige toujours avant de publier. Le brouillon est un point de départ, pas un
texte signé.

---

## 10. Consulter ce qui est en ligne

**La vitrine** : `/p`, ou le raccourci **🌟 Voir mon Portfolio Public** depuis
le dashboard. Elle liste toutes les preuves en ligne, de la plus récente à la
plus ancienne. Chaque carte mène à sa fiche `/p/<slug>`.

Visite-la de temps en temps depuis une fenêtre de navigation privée : c'est
exactement ce qu'un visiteur voit.

**Le journal des mesures** : `/dashboard/mesures`. Il enregistre quatre
événements de la chaîne de valeur — *Projet créé*, *Étape terminée*,
*Livrable attaché*, *Preuve publiée* — avec leurs totaux et la liste
antéchronologique.

Deux choses à savoir pour ne pas mal lire cette page :

- **Le journal ne connaît pas le passé.** Il n'enregistre que ce qui s'est
  produit depuis sa mise en service. Les projets créés avant n'y figureront
  jamais, et aucun rattrapage n'est possible : le journal ne se réécrit pas.
  Des compteurs à zéro sur d'anciens projets sont donc normaux, pas une panne.
- **Les projets de test sont écartés.** Les projets nommés `[E2E] …` sont
  produits par les tests automatiques et n'entrent pas dans les totaux. Le lien
  *Les afficher quand même* en bas de page les réintègre à la lecture.

---

## 11. Ce que le système ne fait pas (encore)

Autant le savoir avant de le chercher :

- **Aucune suppression.** Ni projet, ni livrable, ni preuve. On archive, et
  l'archivage est définitif.
- **Une preuve publiée ne se corrige pas.** Ni son titre, ni son résumé. La
  seule sortie est de la retirer de la vitrine et d'en refaire une. D'où la
  relecture avant de cliquer **Publier la preuve 🚀**.
- **Aucune publication automatique** sur LinkedIn ou X : le copier-coller est
  manuel, par choix.
- **Un seul compte.** Pas d'inscription, pas d'invitation, pas de partage.

---

## 12. Quand quelque chose coince

| Ce que tu observes | Ce qui se passe |
|---|---|
| Tu retombes sur `/login` | Session expirée. Reconnecte-toi, rien n'est perdu. |
| Le bouton **Terminer** est absent | L'étape est encore *À faire* : clique **Démarrer** d'abord. Ou elle est déjà *Terminée*, et c'est un état sans retour. |
| Le bouton **🌟 Preuve publique** est absent | Le livrable est en *Brouillon* : clique **Publier** d'abord. |
| Le bouton **Archiver** est absent | Le projet est en *Idée* ou *Cadré*. Fais-le avancer jusqu'à *En cours*. |
| La liste des statuts ne propose pas celui que tu veux | Ce passage n'est pas autorisé depuis le statut actuel — voir le schéma en §4. |
| Une preuve publiée n'apparaît pas sur `/p` | Il n'y a pas de délai de cache : l'affichage est immédiat. Vérifie plutôt que la preuve n'a pas été retirée de la vitrine. |
| `/dashboard/mesures` affiche des zéros | Normal si l'activité est antérieure au journal, ou si les seuls événements viennent de projets `[E2E]`. |
| Un message d'erreur rouge sous un bouton | L'action a été refusée par une règle de la méthode (transition interdite, champ manquant). Le message dit laquelle. Rien n'a été enregistré. |

Si le problème n'est pas dans cette liste, il est technique : va voir
`docs/technique/`.
