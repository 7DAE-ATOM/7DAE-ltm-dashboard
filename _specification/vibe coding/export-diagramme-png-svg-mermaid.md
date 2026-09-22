# Feature Spec: Export du diagramme en PNG, SVG ou Mermaid

## Summary
Ajouter à la barre d'outils de **Dependency Graph** (`/depgraph`) un bouton **Export** ouvrant un menu à trois entrées — **PNG**, **SVG**, **Mermaid** — sur le modèle de ce que fait déjà l'application sœur `C:\projects\airbus\atom\7DAE-app-dashboard` sur sa page Discover (`components/discover/DiscoverExportMenu.tsx`), et conformément à la capture `temp/image.jpg` : un bouton d'icône, un menu déroulant intitulé « EXPORT AS », une ligne par format avec son extension alignée à droite (`.png`, `.svg`, `.mmd`).

Deux mécanismes distincts derrière un seul menu :
- **PNG et SVG** capturent le canevas **tel qu'il est rendu** — donc avec les réglages d'affichage en cours, le thème, les positions déplacées à la main et les courbures de liens dialées par l'utilisateur.
- **Mermaid** ne capture rien : il **reconstruit** le diagramme à partir du modèle, en texte, destiné à être réimporté ailleurs (draw.io : Arrange → Insert → Advanced → Mermaid).

## Motivation
- Un diagramme de dépendances se construit pour être **montré** : dans une revue, un compte rendu, une présentation. Aujourd'hui il ne sort de l'application que sous forme d'un fichier de sauvegarde JSON, qui ne se relit que dans cette même application.
- L'utilisateur qui a passé du temps à choisir ses bancs, à les étendre, à déplacer les cartes et à courber les liens n'a **aucun moyen d'en tirer une image**. Une capture d'écran manuelle perd la partie hors cadre et la résolution.
- Mermaid répond à un besoin différent du PNG : obtenir des **formes natives et éditables** dans draw.io plutôt qu'une image figée, pour que le diagramme continue sa vie dans un autre outil.
- La page Discover de l'application sœur a déjà tranché ces trois formats et leur ergonomie ; il s'agit de reprendre un dispositif éprouvé, pas d'en inventer un.

## Requirements

### Functional Requirements

#### 1. Le bouton et son menu
- Un bouton d'icône est ajouté à la barre d'outils de `/depgraph`, dans le même style que les contrôles voisins (sauvegarde, réglages d'affichage), de sorte que les trois se lisent comme un ensemble.
- Un clic ouvre un menu contenant un intitulé « Export as » et trois entrées : PNG, SVG, Mermaid, chacune affichant son extension de fichier alignée à droite.
- Le menu se ferme par `Échap`, par un clic à l'extérieur, et après avoir choisi un format.
- Le bouton est inactif quand le diagramme est vide : il n'y a rien à exporter.

#### 2. Pendant la génération
- Une génération d'image peut prendre un instant sur un diagramme dense. Tant qu'elle est en cours, le format concerné l'indique, et **les trois entrées sont verrouillées** — elles lisent toutes le même canevas, et deux générations concurrentes se gêneraient.
- L'état d'occupation se termine, que la génération réussisse ou échoue.

#### 3. PNG et SVG — capture du rendu
- L'export capture **ce que l'utilisateur voit** : réglages d'affichage des cartes, thème clair ou sombre, positions déplacées à la main, courbures de liens, types de relations masqués par la légende.
- Le cadrage couvre **l'intégralité du diagramme**, pas seulement la portion visible à l'écran : ni le zoom ni le défilement courants ne doivent influencer ce qui se retrouve dans le fichier.
- Le zoom et la position du canevas à l'écran ne doivent **pas** être modifiés par l'export : l'utilisateur retrouve sa vue exactement comme il l'avait laissée.
- Une marge est ménagée autour du diagramme pour que rien ne touche le bord de l'image.
- Le PNG est généré à une résolution supérieure à l'affichage, de sorte que le **texte** reste lisible quelle que soit la taille du diagramme.
- Les éléments de contrôle qui n'appartiennent pas au diagramme (poignées de courbure, contrôles de zoom, légende, fond quadrillé — à arbitrer, voir Open Questions) sont exclus de l'image.

#### 4. Mermaid — reconstruction du modèle
- L'export produit un texte de diagramme Mermaid décrivant les bancs affichés et les relations entre eux.
- Les bancs **sélectionnés** se distinguent visuellement de ceux amenés par une expansion.
- Le sens des relations est conservé.
- Les libellés doivent survivre à la conversion : un guillemet ou un retour à la ligne dans un nom de banc ne doit pas casser le diagramme produit.
- La sortie est pensée pour être réimportée dans draw.io, ce qui implique de porter le sens par les **formes** plutôt que par des règles de style, les secondes ne survivant pas toujours à la conversion.

#### 5. Nommage et téléchargement
- Le fichier est remis au flux de téléchargement du navigateur, avec un nom parlant comportant une **date**.
- Le nom reprend celui de la sauvegarde active lorsqu'il y en a une, et retombe sinon sur un nom générique.

#### 6. Ne pas confondre avec l'export existant
- Le menu « … » de la barre d'outils propose **déjà** un « Export » : celui du **fichier de sauvegarde JSON**, qui sert à réimporter le diagramme dans cette application. Le nouveau bouton exporte une **représentation** du diagramme, destinée à l'extérieur.
- Les deux doivent rester distinguables sans hésitation dans l'interface : intitulés, emplacement et icônes ne doivent pas se marcher dessus (voir Open Questions).

### Non-Functional Requirements
- **Aucun appel réseau** : toute la génération se fait côté client, à partir de ce qui est déjà en mémoire ou à l'écran.
- L'export doit produire un résultat correct en thème **clair comme sombre**, l'image reprenant le thème actif au moment de la capture.
- Un diagramme trop grand pour être rendu en image par le navigateur doit produire un **message explicite**, et non une image vide ou un échec silencieux : les navigateurs plafonnent la taille d'un canevas et rendent une image blanche au-delà, sans lever d'erreur.
- Le menu doit être utilisable au clavier et correctement étiqueté.
- **Aucune régression** sur : la sauvegarde/chargement et l'export/import JSON existants, le menu contextuel, la loupe de sélection, les réglages d'affichage, la poignée de courbure des liens, le masquage de nœuds.

## Scope

### In Scope
- Le bouton Export et son menu à trois formats dans la barre d'outils de `/depgraph`.
- La capture du canevas en PNG et en SVG, cadrée sur l'intégralité du diagramme.
- La génération du texte Mermaid à partir du diagramme affiché.
- Le nommage des fichiers et leur remise au navigateur.
- La gestion de l'état « génération en cours » et des erreurs de taille.

### Out of Scope
- Modification de l'export/import du fichier de sauvegarde JSON existant.
- Export depuis les pages Catalogue, Map ou Dependency View (`/depview`).
- Export vers d'autres formats (PDF, JPEG, draw.io natif).
- Impression, ou mise en page multi-pages.
- Choix par l'utilisateur de la résolution, du cadrage ou du fond de l'image.
- Réimport d'un fichier Mermaid dans l'application.

## Affected Areas
- Nouveau composant de menu d'export pour la barre d'outils, sur le modèle de `DiscoverExportMenu` de la référence, et une icône d'export dans `components/icons/` (le dossier n'en contient pas).
- `components/InteractionClient.tsx` — accueil du bouton dans la barre d'outils, et orchestration des trois exports (état d'occupation, messages d'erreur, nommage).
- `components/interaction/DependencyGraph.tsx` — de quoi donner accès, depuis l'extérieur, à l'élément du canevas à capturer, à l'étendue du diagramme à cadrer, et à une description du graphe pour Mermaid. La poignée impérative existante (`getSnapshot`, `addBench`, `removeBench`) est le point d'entrée naturel.
- Nouveaux modules de génération : un pour la capture d'image, un pour le texte Mermaid — à tenir séparés, puisqu'ils ne partagent ni leur source de données ni leur mécanique.
- Réutilisation du dispositif de téléchargement déjà employé par l'export du fichier de sauvegarde.

## Edge Cases
- **Diagramme vide** : bouton inactif, aucune entrée de menu n'est atteignable.
- **Diagramme très grand** : au-delà de ce que le navigateur sait rendre, message explicite plutôt qu'image blanche.
- **Un nœud ne correspondant à aucun banc du catalogue** : il figure sur l'image comme à l'écran, et doit aussi figurer dans la sortie Mermaid, avec l'identifiant dont on dispose.
- **Nom de banc contenant un guillemet, une apostrophe ou un retour à la ligne** : le texte Mermaid doit rester valide.
- **Nœuds isolés, sans aucune relation** : ils doivent apparaître dans les trois formats — l'export ne doit pas ne montrer que ce qui est relié.
- **Type de relation masqué par la légende** : l'image reflète ce qui est affiché ; ce que doit faire Mermaid dans ce cas est à trancher (voir Open Questions).
- **Deux exports lancés coup sur coup** : le second est refusé tant que le premier n'a pas rendu la main.
- **Export lancé pendant qu'une carte est en cours de déplacement** : ne doit produire ni image corrompue ni position figée à mi-course.

## Open Questions
- Que doit contenir l'image autour du diagramme : le fond quadrillé du canevas, la légende des relations, les contrôles de zoom ? Ou strictement les cartes et les liens, sur un fond uni ? => strictement les cartes et les liens, sur un fond transparent

- Le PNG doit-il avoir un fond opaque (reprenant la couleur de fond du thème) ou transparent ? Un fond transparent se colle mieux dans une présentation, un fond opaque évite le texte clair invisible sur diapositive blanche en thème sombre. => fond transparent

- Mermaid doit-il refléter les types de relations masqués par la légende (donc les omettre) ou décrire le modèle complet, la légende n'étant qu'un filtre d'affichage ? => refléter les types de relations masqués par la légende, uniquement ce qui est affiché à l'écran

- Comment nommer précisément les deux exports pour lever l'ambiguïté avec l'export JSON existant : renommer ce dernier en « Download save » / « Export save file », placer le nouveau bouton à distance du menu « … », ou les deux ? => laisse tel quel pour l'instant et place le bouton entre le bouton save (disuqette) et ...

- La capture du rendu suppose une bibliothèque tierce que ce projet n'embarque pas encore, contrairement à l'application de référence. Est-ce acceptable d'ajouter cette dépendance, ou l'export doit-il se limiter aux formats réalisables sans elle ? => oui importe cette librairie et reste homogéne avec 7DAE-app-dashboard

## Acceptance Criteria
- [ ] Un bouton Export est présent dans la barre d'outils de `/depgraph` et ouvre un menu listant PNG, SVG et Mermaid avec leurs extensions.
- [ ] Le menu se ferme par `Échap`, par un clic extérieur et après un choix.
- [ ] Le bouton est inactif sur un diagramme vide.
- [ ] L'export PNG et l'export SVG produisent un fichier contenant **tout** le diagramme, quel que soit le zoom ou le défilement au moment du clic.
- [ ] Le zoom et la position du canevas sont inchangés après un export.
- [ ] L'image reflète les réglages d'affichage, le thème, les positions déplacées à la main et les courbures de liens.
- [ ] Le texte du PNG reste lisible sur un diagramme de grande taille.
- [ ] L'export Mermaid produit un texte valide, distinguant les bancs sélectionnés des autres et conservant le sens des relations.
- [ ] Un nom de banc contenant un guillemet ne casse pas la sortie Mermaid.
- [ ] Les fichiers téléchargés portent un nom parlant et daté.
- [ ] Pendant une génération, les trois entrées sont verrouillées ; l'état se termine en cas d'erreur comme en cas de succès.
- [ ] Un diagramme trop grand pour le navigateur produit un message explicite.
- [ ] Aucune régression sur l'export/import du fichier de sauvegarde JSON, qui reste distinct et reconnaissable.
