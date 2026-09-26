Règles globales : accent vert #15803d (token unique) · aucune mention « Togo » ·
aucun mot « méthode » (déjà testé) · Nexlance absent tant que null dans contact.ts.
S1 Nav collante en haut : liens Études de cas · Services · À propos · Contact
   + bouton « Discutons de votre projet ». Chaque lien pointe vers un id existant de la page.
S2 Hero : titre « Je construis des systèmes IA qui font gagner des heures aux
   indépendants et petites entreprises » + sous-titre + 2 CTA (vers #contact et vers
   les cas) + note « exemple réel : 2 h/jour → 25 leads en 2 min ».
S3 Bandeau de confiance, 4 items : systèmes réels livrés · résultats mesurés ·
   disponible à distance · livraison rapide.
S4 Études de cas = grille : les cartes réelles (base) + 5 cartes statiques
   « en préparation » : avocat · commerce local · comptable · coach · agence.
   Avec 1 preuve publiée → 6 cartes au total.
S5 Anatomie d'une fiche : 01 Problème · 02 Ce que j'ai construit · 03 Résultat · 04 Preuve.
S6 Services, 3 items : systèmes de prospection · relances & suivi client ·
   automatisations sur mesure.
S7 À propos : contient « chaque projet est une preuve, pas une promesse ».
S8 Contact : M'écrire (email) · LinkedIn ; pas de Nexlance si null.
S9 Footer structuré présent (celui déjà construit).

## Décisions cycle 2

D1 S5 : titre visible « Ce que contient chaque étude de cas ».
D2 S4 : cartes réelles d'abord, puis les 5 cartes « en préparation ».
D3 S4 : aucune preuve publiée → les 5 cartes statiques s'affichent (grille jamais vide).
D4 S1 : Études de cas → #cas · Services → #services (à créer) · À propos → #demarche · Contact → #contact.
D5 S1 : collante = sticky top-0, au-dessus du h1.
D6 S7 : le texte exact est « chaque projet est une preuve, pas une promesse ».

## Fiche /p/[slug] (cycle 4)

F1 « Voir le système » = video_url de l'étude de cas uniquement, en lecteur intégré.
   Aucun autre lien ni bouton dans cette section.
F2 Cas vide : pas de lecteur valide (vidéo absente OU non reconnue) → aucune section
   « Voir le système », aucun bouton.
F3 deliverable_url n'apparaît jamais sur une page publique (/p et /p/[slug]) :
   ni l'URL en texte, ni aucun href vers le livrable.
