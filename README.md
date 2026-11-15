# ClocloWords

Mon application personnelle de mémo-cartes pour apprendre le vocabulaire anglais, reliée à mes notes Apple.

## Pourquoi cette app ?

Je suis en voyage linguistique. Au fil du voyage, chaque mot que j’apprenais allait dans une note Apple, avec sa traduction. Au fur et à mesure, la liste a grossi, et je voulais m’entraîner pendant mes trajets en bus, souvent **sans connexion**.

Plutôt que d’utiliser une application existante, j’ai voulu la mienne, **reliée directement à mes notes** : dès que j’ajoute un mot dans la note, un raccourci Apple l’envoie dans l’app et la carte est créée automatiquement. Il n’y a donc rien à saisir dans l’application.

## Fonctionnalités

- Cartes alternées : **à écrire** (réponse vérifiée tout de suite) et **à deviner** (À revoir / Presque / Acquis).
- Sens aléatoire : anglais → français ou français → anglais.
- **Répétition adaptée** : plus un mot est difficile, plus il revient souvent. Un mot acquis revient quand même, mais moins.
- Statistiques : progression, bilan de la semaine, série de jours, nombre de tirages par mot.
- **Fonctionne hors connexion** une fois ouverte une première fois avec du réseau.
- Les données restent **sur l'appareil** (stockage du navigateur). Aucun compte, aucun serveur, aucune collecte.
  
## Format de la note

Une ligne par mot, avec `=` entre l’anglais et le français. Plusieurs traductions se séparent par `/` :

```
empty = vide
full / full of people = rempli / rempli de monde
pretty = plutôt / assez / joli(e) (selon le contexte)
```

Siune traduction dans la note est corrigé, la carte est mise à jour à la synchro. Les statistiques sont conservées.

## Installation sur iPhone

1. Ouvrez l’adresse de l’app dans **un navigateur**.
2. Touchez Partager, puis « Sur l’écran d’accueil ».
3. Ouvrez l’app depuis cette icône. Elle s’affiche en plein écran.

Utilisez toujours cette icône : les données de Safari et celles de l’icône d’accueil sont séparées.

## Le raccourci Apple pour synchroniser la note

Dans l’app **Raccourcis** :

1. Touche **+** pour créer un raccourci, et nomme-le par exemple « Sync ClocloWords ».
2. Ajoute l’action **Trouver des notes** et mets le filtre « Nom » **est** `Anglais vocabulaire` (le nom de ta note). Limite à 1 note.
3. Ajoute l’action **Copier dans le presse-papiers** avec la note trouvée.
4. Touche le nom du raccourci, puis **Ajouter à l’écran d’accueil** pour le lancer d’un geste.

Utilisation, chaque fois que tu as ajouté des mots :

1. Lance le raccourci : il copie ta note.
2. Ouvre ClocloWords, touche **Synchroniser**, puis autorise le collage quand iOS le demande.
3. Un message indique le nombre de mots ajoutés ou mis à jour.

Les libellés des actions peuvent varier légèrement selon la version d’iOS et la langue. Si le texte copié est vide ou étrange, ajoute l’action **Obtenir le texte à partir de l’entrée** avant la copie. Un raccourci ne peut pas écrire directement dans l’application : c’est pourquoi le presse-papiers sert de relais, et pourquoi iOS demande une confirmation du collage.

## Développement

Le code source (React, Tailwind CSS, Vite) est dans `source.zip`.

```bash
npm install
npm run dev     # développement
npm run build   # produit dist/index.html (fichier unique, sans dépendance externe)
```

Le site est publié avec GitHub Pages à partir des fichiers à la racine du dépôt. Pour mettre à jour l’app hors connexion, il suffit de remplacer `index.html` ; si besoin, changez le numéro de version du cache dans `sw.js`.

## Licence

Projet personnel, partagé tel quel. Libre à toi de t’en inspirer.
