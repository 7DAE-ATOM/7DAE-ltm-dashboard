# Feature Spec: Bouton « Connecter les relations » avec compteur de relations non tracées

## Summary
Ajouter à la barre d'outils de **Dependency Graph** (`/depgraph`) un bouton d'action inspiré du bouton « Connect the flows » de l'application sœur `C:\projects\airbus\atom\7DAE-app-dashboard` (`components/discover/DiscoverConnectFlowsButton.tsx`).

Un clic **trace d'un coup toutes les relations de dépendance qui existent entre les bancs déjà affichés** sur le diagramme et qui ne sont pas encore dessinées. Il n'ajoute **aucun banc** : il ne fait que relier ce qui est déjà là.

Un **petit compteur en haut à droite du bouton** annonce combien de relations sont dans ce cas. Il disparaît quand il vaut zéro — c'est-à-dire quand tout ce qui pouvait être relié l'est déjà.

## Motivation
- Depuis que sélectionner un banc n'affiche plus automatiquement ses dépendances (`selection-sans-dependances-automatiques.md`), le diagramme se construit nœud par nœud. C'est le comportement voulu, mais il laisse un cas fréquent sans réponse : l'utilisateur a rassemblé dix bancs à l'écran et veut maintenant **voir d'un coup comment ils se parlent entre eux**, sans les étendre un par un au menu contextuel.
- Le pont Catalogue → Dependency Graph amplifie ce besoin : arriver avec trente bancs présélectionnés donne trente cartes, et découvrir leurs relations mutuelles au clic droit, une par une, n'est pas praticable.
- **Le compteur répond à une question que le diagramme ne sait pas poser aujourd'hui** : « est-ce que ces bancs sont liés entre eux, et ai-je déjà tout vu ? » Un zéro signifie « ce que vous voyez est complet » ; un nombre signifie « il reste quelque chose à révéler ». C'est aussi la seule indication, dans toute l'application, qu'il existe des relations non affichées — la spec précédente ayant écarté toute pastille sur les nœuds.
- Le mécanisme existe déjà en interne : la règle « relier un nœud à tous les nœuds déjà affichés » est appliquée à chaque ajout de banc et à chaque expansion. Le bouton l'applique simplement à **l'ensemble** des nœuds présents, d'un seul geste.

## Requirements

### Functional Requirements

#### 1. L'action
- Un bouton d'icône est ajouté à la barre d'outils de `/depgraph`, aux côtés des commandes de sauvegarde et des réglages d'affichage.
- Un clic trace toutes les relations existant **entre deux nœuds actuellement affichés** et qui ne sont pas déjà dessinées.
- L'action **n'ajoute jamais de nœud**. Un banc lié à un nœud affiché mais absent du diagramme reste absent : le faire venir demeure le rôle du menu contextuel.
- L'action couvre les trois natures de relation traitées par le diagramme (dépendances, bancs supportés, ressources partagées).
- Une relation déjà tracée n'est jamais dupliquée, y compris lorsque la même relation peut être atteinte depuis l'une ou l'autre de ses extrémités.
- L'action marque le diagramme comme comportant des modifications non enregistrées, au même titre qu'une expansion.

#### 2. Le compteur
- Un petit compteur est positionné **en haut à droite du bouton**, chevauchant son coin.
- Il indique le nombre de relations que le bouton tracerait s'il était actionné maintenant.
- Il **n'apparaît pas lorsqu'il vaut zéro**.
- Il se met à jour immédiatement à chaque changement du diagramme : ajout ou retrait d'un banc, expansion, masquage d'un nœud, et bien sûr après un clic sur le bouton lui-même — où il doit retomber à zéro et disparaître.
- Le nombre compté est celui des **relations**, pas des bancs : deux bancs peuvent être liés par plusieurs relations de natures différentes.

#### 3. État du bouton
- C'est une **action**, pas une bascule : il ne conserve aucun état enfoncé et ne peut pas rester visuellement « actif ».
- Il est inactif lorsqu'il n'y a rien à tracer — diagramme vide, ou compteur à zéro — et l'indique visuellement.
- Son libellé accessible et son infobulle disent explicitement ce que l'action **ne fait pas** : elle n'ajoute aucun banc. « Toutes les relations » pourrait sinon se lire comme une promesse d'aller chercher plus loin.

#### 4. Ce que « non tracée » veut dire
- Le compteur mesure les relations **absentes du diagramme**. Il ne compte pas les relations présentes mais rendues invisibles par les bascules de couleur de la légende : masquer un type de relation dans la légende est un filtre d'affichage, pas une absence, et ne doit pas gonfler le compteur ni donner du travail au bouton.

### Non-Functional Requirements
- **Aucun appel réseau** : toutes les relations sont déjà en mémoire côté client. L'action est immédiate et n'a pas besoin d'état « en cours » — contrairement à la référence, où le bouton équivalent déclenche une récupération distante.
- Le calcul du compteur est réévalué à chaque changement du diagramme ; il doit rester imperceptible sur un diagramme de taille réaliste, y compris les trente bancs et plus que le Catalogue peut envoyer.
- Le bouton et son compteur doivent être lisibles en thème clair **et** en thème sombre, et rester cohérents avec l'habillage des autres commandes de la barre d'outils.
- Accessibilité : le bouton est atteignable au clavier, porte un libellé explicite, et le compteur doit être perceptible autrement que par sa seule position (il doit être lu comme faisant partie de l'intitulé de l'action).
- **Aucune régression** sur : la sélection de bancs, le menu contextuel et ses actions d'expansion, le masquage d'un nœud, le retrait d'un banc et sa cascade, la sauvegarde/chargement, l'export/import, la poignée de courbure des liens, les réglages d'affichage.

## Scope

### In Scope
- Le bouton d'action dans la barre d'outils de `/depgraph`, son icône, son libellé et son infobulle.
- Le compteur de relations non tracées, son placement et sa règle de disparition à zéro.
- Le tracé en une fois de toutes les relations manquantes entre nœuds affichés.

### Out of Scope
- Toute forme d'ajout de bancs au diagramme : l'action ne fait que relier l'existant.
- Une action inverse (« déconnecter », retirer toutes les arêtes d'un coup).
- Un compteur ou une pastille de relations non affichées **sur les nœuds** eux-mêmes — déjà écarté par `selection-sans-dependances-automatiques.md`.
- Modification des bascules de la légende ou de leur effet.
- Extension du même bouton à la page Dependency View (`/depview`), qui construit son graphe autrement.
- Modification du format d'enregistrement des diagrammes.

## Affected Areas
- Nouveau composant de bouton pour la barre d'outils, sur le modèle de `DiscoverConnectFlowsButton` de la référence, et une nouvelle icône dans `components/icons/`.
- `components/InteractionClient.tsx` — accueil du bouton dans la barre d'outils, à côté de `SaveLoadControls` et `DisplaySettingsControl`.
- `components/interaction/DependencyGraph.tsx` — exposition, via la poignée impérative déjà utilisée pour ajouter et retirer un banc, de quoi (a) connaître le nombre de relations non tracées et (b) les tracer toutes. La logique de sélection des arêtes à ajouter existe déjà : c'est la même règle « relier aux nœuds déjà affichés » appliquée à chaque nœud du diagramme plutôt qu'à un seul.

## Edge Cases
- **Diagramme vide** : bouton inactif, aucun compteur.
- **Aucune relation entre les bancs affichés** : compteur absent, bouton inactif — indiquant, utilement, que ces bancs ne se parlent pas.
- **Toutes les relations déjà tracées** : même chose, et c'est le cas normal juste après un clic.
- **Un nœud du diagramme ne correspond à aucun banc du catalogue** : il ne porte pas de liste de relations ; il est simplement ignoré par le calcul comme par l'action.
- **Deux bancs liés par plusieurs relations de natures différentes** : chacune compte pour une, et chacune est tracée.
- **Une relation atteignable depuis ses deux extrémités** : elle compte pour une seule, et n'est tracée qu'une fois.
- **Masquer un nœud après avoir cliqué le bouton** : les arêtes qui le touchaient disparaissent avec lui ; le compteur ne doit pas se mettre à annoncer des relations vers un nœud absent.
- **Retirer un banc puis le resélectionner** : le compteur doit refléter l'état réel à chaque étape.
- **Charger un diagramme enregistré** : le compteur se recalcule sur ce qui vient d'être chargé, et peut être non nul si l'enregistrement ne contenait pas toutes les relations entre ses nœuds.

## Open Questions
- Le bouton doit-il figurer dans la barre d'outils principale, ou parmi les contrôles flottants du canevas (à côté du zoom) ? La barre d'outils est déjà chargée : recherche, sélection, loupe, sauvegarde, réglages. => à gauche de la disquette de sauvegarde

- Le compteur doit-il être plafonné à un affichage court (« 99+ ») pour ne pas déformer le bouton sur un diagramme très dense ? => oui

- Après un clic, faut-il signaler ce qui vient d'être ajouté (mise en évidence passagère des nouvelles arêtes), ou le simple passage du compteur à zéro suffit-il ? => passage du compteur à 0 suffit

- Le tracé en masse doit-il être annulable d'un geste, ou la sauvegarde et le rechargement suffisent-ils comme filet ? => sauvegarde suffit

## Acceptance Criteria
- [ ] Un bouton d'action est présent dans la barre d'outils de `/depgraph` et n'a pas d'état enfoncé.
- [ ] Un clic trace toutes les relations existant entre nœuds affichés et non encore dessinées, sans ajouter aucun nœud.
- [ ] Après ce clic, le compteur vaut zéro et disparaît.
- [ ] Le compteur est positionné en haut à droite du bouton, indique le nombre de relations non tracées, et est absent lorsqu'il vaut zéro.
- [ ] Le compteur se met à jour après un ajout de banc, un retrait, une expansion, un masquage et un chargement de diagramme.
- [ ] Le bouton est inactif quand il n'y a rien à tracer.
- [ ] Une relation n'est jamais dupliquée, quelle que soit l'extrémité depuis laquelle elle est atteinte.
- [ ] Masquer un type de relation dans la légende ne modifie ni le compteur ni le comportement du bouton.
- [ ] L'action marque le diagramme comme non enregistré.
- [ ] Aucune régression sur la sélection, le menu contextuel, le masquage, le retrait, la sauvegarde/chargement et l'export/import.
