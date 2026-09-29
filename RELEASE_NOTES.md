# Notes de version — LTM Dashboard

Catalogue visuel des moyens d'essai (Lab Test Means) Airbus.

> Les versions ci-dessous ont été reconstituées a posteriori à partir de l'historique du projet. Chaque version correspond à une étape visible pour les utilisateurs.

---

## v1.3.0 — 25 septembre 2026
**Des filtres identiques partout et un diagramme de dépendances plus facile à partager**

### Filtres
- **Le même panneau de filtres sur le Catalogue, la Carte et la Dependency View.** Une sélection faite sur une page est conservée quand vous passez à une autre.
- **Des puces de filtre plus lisibles.** Elles sont plus grandes, colorées, et indiquent le nombre de moyens d'essai qui correspondent à chaque valeur.
- **Des sections repliables.** Repliez les filtres qui ne vous servent pas ; l'application s'en souvient à votre prochaine visite.
- **Choisir les moyens d'essai affichés un par un.** Une liste à cocher permet d'écarter ou de réintégrer un moyen d'essai sans toucher aux autres filtres.

### Catalogue
- **Densité d'affichage réglable.** Choisissez le nombre de cartes par ligne selon la taille de votre écran.
- **Nouveau bloc « Actions ».** L'export PDF et l'ouverture de la sélection en cours dans le diagramme de dépendances sont regroupés au même endroit.

### Dependency Graph
- **Export du diagramme en PNG, SVG ou Mermaid**, pour l'insérer dans une présentation, un document ou un wiki.
- **Cartes redimensionnables à la souris.** Élargissez une carte en tirant sur son bord pour afficher un nom long en entier.
- **Vous choisissez ce qui est affiché.** Sélectionner un moyen d'essai n'ajoute plus automatiquement toutes ses relations, ce qui évite de surcharger le diagramme. Vous les ajoutez quand vous le souhaitez, par clic droit.
- **Vue d'ensemble de la sélection.** Une fenêtre liste tous les moyens d'essai sélectionnés, même quand ils sont trop nombreux pour la barre d'outils.
- **Liens plus lisibles.** La courbure des liens est ajustable pour démêler les zones chargées.

---

## v1.2.0 — 1er septembre 2026
**Visualiser les dépendances entre moyens d'essai**

### Nouveau : Dependency Graph
- **Un diagramme interactif des relations.** Cherchez un ou plusieurs moyens d'essai pour afficher leurs relations : ce dont ils dépendent, ce qu'ils supportent et les ressources qu'ils partagent.
- **Exploration pas à pas.** Un clic droit sur n'importe quelle carte permet d'ajouter ses dépendances, ses ressources partagées, ou de la masquer. Le diagramme se réorganise automatiquement, sans chevauchement.
- **Des liens qui se lisent d'un coup d'œil.** Chaque type de relation a sa couleur. Une dépendance optionnelle est en pointillés, une dépendance obligatoire en trait plein.
- **Cartes personnalisables.** Choisissez les informations affichées (statut, type, ville, bâtiment et salle) et la largeur des cartes.
- **Enregistrer et partager ses diagrammes.** Enregistrez un diagramme pour le rouvrir plus tard, exportez-le en fichier et envoyez-le à un collègue, qui pourra l'importer.

### Nouveau : Dependency View
- **Une vue d'ensemble circulaire.** Tous les moyens d'essai filtrés sont disposés en cercle, avec leurs relations. Survolez un moyen d'essai pour voir ses liens entrants et sortants.
- **Nombre maximal réglable.** Vous choisissez combien de moyens d'essai la vue peut afficher au maximum.

### Catalogue et fiches
- **Badge DRAFT / RELEASE** sur chaque moyen d'essai pour connaître son état de validation, avec un filtre « Quality Seal » associé.

### Photos
- **Indicateur de chargement** sur chaque photo pendant son téléchargement.
- **Photos gardées en mémoire entre deux visites** : les photos déjà vues s'affichent instantanément. Vous pouvez activer ce cache, limiter sa taille ou le vider.

---

## v1.1.0 — 18 juin 2026
**Plus rapide, plus complet**

- **Navigation nettement plus rapide.** Les données sont chargées une seule fois par session, puis le passage d'une page à l'autre est immédiat.
- **Filtres conservés.** En revenant d'une fiche au catalogue, vous retrouvez vos filtres et votre page.
- **Nouveau type « Shared Resource ».** Les ressources partagées ont leur propre type, visible dans les filtres, les fiches et l'export PDF.
- **Bouton « Actualiser ».** Rechargez les dernières données sans recharger toute l'application.
- **Fenêtre « À propos »** qui affiche la version de l'application. Vous pouvez copier ces informations en un clic pour les joindre à une demande de support.
- **Export PDF repensé.** Chaque fiche du PDF reprend la mise en page de l'écran, à la charte Airbus.

---

## v1.0.0 — 9 juin 2026
**Mise en service sur la plateforme Airbus**

- **Accès sécurisé avec votre compte Airbus.** Pas d'identifiant supplémentaire à saisir : vos droits d'accès aux données sont appliqués automatiquement.
- **Message clair en cas d'indisponibilité.** Si la source de données ne répond pas, un écran dédié l'explique au lieu d'une page d'erreur.
- **Chargement plus rapide** de l'application.

---

## v0.2.0 — 6 mai 2026
**Des filtres plus précis et une carte plus lisible**

- **Filtre par Portfolio.**
- **Filtre par programme avion sous forme d'arborescence** (famille, programme, version), en suivant la structure avion officielle.
- **Carte regroupée par site.** Chaque site (Toulouse, Hambourg, Filton, Brême) est représenté par un cercle dont la taille reflète le nombre de moyens d'essai qui correspondent aux filtres.

---

## v0.1.0 — 1er mai 2026
**Première version du catalogue visuel**

- **Catalogue des moyens d'essai** en cartes illustrées, avec filtres (type, statut, complexité, pays, programme) et pagination.
- **Carte interactive** pour localiser les moyens d'essai sur les sites Airbus.
- **Fiche détaillée** de chaque moyen d'essai : photos, sécurité et conditions d'accès, cycle de vie, interlocuteurs, programmes et projets.
- **Lecture rapide par pictogrammes** : type, statut, complexité, programmes avion, chapitres ATA, capacités techniques, et mini-carte du pays.
- **Visionneuse 360°** pour les photos panoramiques.
- **Export PDF** des moyens d'essai qui correspondent aux filtres : page de garde, sommaire et une fiche par moyen d'essai.
- **Mode clair et mode sombre**, au choix.
