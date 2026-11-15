# ClocloWords

Mon application personnelle de mémo-cartes pour apprendre le vocabulaire anglais.

## Pourquoi cette app ?

Je suis en voyage linguistique. Au fil du voyage, chaque mot que j’apprenais allait dans une note Apple, avec sa traduction. Au fur et à mesure, la liste a grossi, et je voulais m’entraîner pendant mes trajets en bus, souvent **sans connexion**.

Plutôt que d’utiliser une application existante, j’ai voulu la mienne. J’avais d’abord relié l’app à mes notes avec un raccourci Apple, mais c’était lourd : je gère maintenant mes mots **directement dans l’app**. J’ajoute un mot et sa traduction dans un tableau, et la carte existe aussitôt, dans le jeu comme dans la liste.

## Fonctionnalités

- **Ajouter et corriger des mots dans l’app** : l’onglet Ma note est un tableau anglais / français / catégorie, modifiable directement. Le bouton + ouvre une fenêtre pour ajouter autant de mots qu’on veut à la suite. Une ligne modifiée met à jour la carte en temps réel, sans perdre sa progression. Si le mot existe déjà, l’app le signale au lieu de créer un doublon.
- Cartes alternées : **à écrire** (réponse vérifiée tout de suite, accents et majuscules tolérés, « Je ne sais pas » possible) et **à deviner** (on retourne la carte puis on la glisse : à droite = bon, à gauche = pas bon, vers le haut = à revoir).
- Sens aléatoire : anglais → français ou français → anglais.
- **Mot acquis** : 3 bonnes réponses écrites et 3 bonnes réponses devinées d’affilée. Plus un mot est maîtrisé, plus il revient rarement, mais il revient toujours pour ne pas l’oublier.
- **Séances courtes** : 5, 10, 20 cartes ou libre, avec un bilan à la fin.
- **À revoir seulement** : un filtre sur les mots pas encore acquis ou en cours.
- **Annuler** la dernière réponse.
- **Catégories** : une catégorie facultative par mot (sinon rangement automatique : Verbes, Expressions, Mots), et une rangée pour réviser un seul thème.
- **Liste** : tous les mots en petites cartes, deux par ligne, avec un réglage anglais ou français pour la face visible.
- **Verbes irréguliers** : environ 70 verbes. On donne le verbe en anglais ou en français et on écrit les autres formes (prétérit, participe passé, traduction ou infinitif).
- Statistiques : progression, bilan de la semaine, série de jours, tirages par mot.
- **Fonctionne hors connexion** une fois ouverte une première fois avec du réseau.
- Les données restent **sur l’appareil** (stockage du navigateur). Aucun compte, aucun serveur, aucune collecte.
- **Réglages** : longueur des séances, sens des cartes, type de carte, nombre de réussites pour acquérir un mot, sauvegarde et restauration, remise à zéro de la progression.
- Design rose pastel, en thème clair.

## Sauvegarde

Les mots et la progression sont enregistrés dans le navigateur du téléphone. Si on supprime l’icône ou les données du site, ils disparaissent. Dans Ma note, l’icône de réglages donne accès à « Copier la sauvegarde » : toutes les données sont copiées dans le presse-papiers, on les colle dans une note, et on les restaure avec « Restaurer depuis le presse-papiers ».

## Installation sur iPhone

1. Ouvre l’adresse de l’app dans **Safari**.
2. Touche Partager, puis « Sur l’écran d’accueil ».
3. Ouvre l’app depuis cette icône. Elle s’affiche en plein écran.

Utilise toujours cette icône : les données de Safari et celles de l’icône d’accueil sont séparées.

## Développement

Le code source (React, Tailwind CSS, Vite) est dans le dossier `source`.

```bash
npm install
npm run dev     # développement
npm run build   # produit dist/index.html (fichier unique, sans dépendance externe)
```

Le site est publié avec GitHub Pages à partir des fichiers à la racine du dépôt. Pour mettre à jour l’app hors connexion, il suffit de remplacer `index.html` ; si besoin, change le numéro de version du cache dans `sw.js`.

## Licence

Projet personnel, partagé tel quel. Libre à toi de t’en inspirer.
