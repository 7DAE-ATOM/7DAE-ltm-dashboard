# Feature Spec: Sélectionner un banc n'affiche plus automatiquement ses dépendances

## Summary
Sur la page **Dependency Graph** (`/depgraph`), sélectionner un lab test mean ajoute aujourd'hui au diagramme **le banc *et* toutes ses relations directes** (dépendances, bancs qu'il supporte, ressources partagées), avec les nœuds correspondants.

Ce dépliage automatique doit disparaître : **sélectionner un banc n'ajoute que ce banc**. L'affichage des relations devient une **action explicite de l'utilisateur**, via le menu contextuel déjà en place sur chaque nœud (« Show depends on », « Show supports », « Show shared resources », « Usable by »).

Le diagramme devient ainsi quelque chose que l'on construit volontairement, nœud par nœud, au lieu de quelque chose qu'il faut d'abord déblayer.

## Motivation
- **Un banc fortement connecté remplit le diagramme d'un coup.** L'utilisateur qui veut examiner une seule relation reçoit d'emblée l'ensemble du voisinage, et doit masquer à la main ce qu'il n'a pas demandé.
- **L'intention de l'utilisateur est perdue.** Rien ne distingue visuellement ce qu'il a délibérément fait apparaître de ce que l'application a déplié pour lui.
- **Le cas « sélection multiple » est devenu courant.** Le bloc ACTIONS du Catalogue peut désormais envoyer la sélection filtrée entière vers `/depgraph` — trente bancs et au-delà. Avec le dépliage automatique, trente bancs produisent immédiatement un enchevêtrement illisible, alors que trente cartes isolées restent un point de départ exploitable.
- **Le mécanisme d'expansion manuelle existe déjà** et fonctionne : le menu contextuel des nœuds sait ajouter les relations d'un banc à la demande. La demande consiste à en faire le **seul** chemin, pas à en créer un nouveau.

## Requirements

### Functional Requirements

#### 1. Sélectionner un banc n'ajoute que ce banc
- Choisir un banc via la recherche de la barre d'outils ajoute **un seul nœud** au diagramme : celui du banc choisi, marqué comme racine.
- **Aucun nœud voisin** n'est créé. Les seules arêtes tracées sont celles reliant le banc ajouté à des nœuds **déjà affichés** — aucune relation ne fait apparaître quoi que ce soit de nouveau.
- Cela vaut quel que soit le nombre de relations que porte le banc.

#### 2. Ouvrir `/depgraph` avec une sélection préexistante suit la même règle
- Arriver sur la page avec des bancs déjà sélectionnés dans l'URL (lien partagé, ou ouverture depuis le bloc ACTIONS du Catalogue) affiche **uniquement les cartes de ces bancs**, sans leurs relations.
- Le placement initial doit rester lisible quand ces cartes n'ont aucune arête entre elles : des dizaines de nœuds isolés ne doivent ni se superposer ni partir hors du cadre.
- Si deux bancs sélectionnés sont directement liés l'un à l'autre, voir Open Questions.

#### 3. L'affichage des relations reste une action utilisateur
- Le menu contextuel d'un nœud conserve ses actions d'expansion actuelles, inchangées : afficher les dépendances, les bancs supportés, les ressources partagées, ou les utilisateurs d'une ressource.
- Ces actions restent la **seule** façon de faire apparaître un **nœud** voisin.
- La règle des arêtes est la même partout : un nœud amené par une expansion reçoit lui aussi ses arêtes vers **tous** les nœuds déjà affichés, pas seulement vers celui qui l'a fait apparaître. Deux nœuds visibles et liés sont toujours reliés à l'écran.
- L'action « Hide » d'un nœud reste disponible et conserve son comportement.

#### 4. Promouvoir un nœud déjà affiché
- Sélectionner un banc qui est déjà présent au diagramme en tant que voisin (amené par une expansion) le marque comme racine, **sans ajouter aucun nœud** — seules ses arêtes vers des nœuds déjà affichés apparaissent.

#### 5. Nœuds isolés conservés
- Un nœud sans aucune arête reste affiché tant que l'utilisateur ne le masque pas lui-même. Le retrait d'un banc ne doit pas l'emporter au passage.
- La cascade existante reste par ailleurs inchangée : un nœud dont l'unique arête menait au banc retiré disparaît bien avec lui.

### Non-Functional Requirements
- **Aucune régression** sur : la sauvegarde et le chargement de diagrammes, l'export/import, le menu contextuel, l'aperçu au double-clic, le lien du titre vers la fiche, le déplacement des nœuds, la poignée de courbure des liens, les réglages d'affichage.
- **Les diagrammes enregistrés avant cette évolution doivent se recharger à l'identique.** Un enregistrement décrit explicitement ses nœuds et ses arêtes : il est le reflet de ce que l'utilisateur avait construit, et ne doit pas être réinterprété à la lumière de la nouvelle règle.
- Le marqueur « modifications non enregistrées » doit continuer à refléter fidèlement les actions : ajouter un banc, l'étendre, masquer un nœud.
- Aucun appel réseau supplémentaire : les relations sont déjà en mémoire, seule leur mise à l'écran change.

## Scope

### In Scope
- Suppression du dépliage automatique des relations lors de l'ajout d'un banc à la sélection.
- Suppression du dépliage automatique lors de la construction initiale du diagramme à partir de la sélection d'URL.
- Placement initial de plusieurs bancs racines sans arêtes entre eux.
- Conservation des nœuds isolés lors du retrait d'un banc.

### Out of Scope
- Modification des libellés du menu contextuel et du périmètre de relations couvert par chaque action.
- Ajout d'un indice de découvrabilité, ou d'une pastille signalant les relations non affichées (tranché : non).
- Ajout d'un mécanisme « tout déplier » ou « déplier sur N niveaux ».
- Modification du format d'enregistrement des diagrammes.
- Modification de la page Dependency View (`/depview`), qui a son propre mode de construction.
- Modification du panneau de filtres ou du pont Catalogue → Dependency Graph.

## Affected Areas
- `components/interaction/DependencyGraph.tsx` — les deux chemins qui déplient aujourd'hui :
  - la construction initiale du diagramme à partir des bancs sélectionnés (structure envoyée au moteur de placement, puis nœuds et arêtes rendus) ;
  - l'ajout d'un banc en cours de session, qui collecte aujourd'hui ses nœuds et arêtes voisins.
- `components/interaction/InteractionEmptyState.tsx` — le message d'accueil promettait d'afficher les dépendances à la sélection ; à corriger.
- **Vérifié : `components/interaction/useElkLayout.ts` n'a besoin de rien.** Il découpe déjà en composantes connexes, court-circuite ELK pour une composante à un seul nœud et carrelle les composantes — N racines isolées donnent donc une grille sans travail supplémentaire.
- **`components/interaction/DependencyLegend.tsx` reste inchangée** : toujours affichée, compteurs à zéro compris (tranché).

## Edge Cases
- **Banc sans aucune relation** : comportement inchangé de fait — une carte isolée, comme avant.
- **Deux bancs sélectionnés directement liés entre eux** : l'arête qui les relie doit-elle apparaître d'office ? Voir Open Questions.
- **Sélection massive depuis le Catalogue** (30 bancs et plus) : le diagramme doit rester utilisable, les cartes lisibles et non superposées.
- **Banc déjà présent comme voisin, puis sélectionné** : promotion en racine sans expansion (exigence 4).
- **Expansion manuelle d'un nœud dont tous les voisins sont déjà affichés** : l'action ne doit rien dupliquer ni signaler d'erreur.
- **Retirer un banc de la sélection après avoir étendu ses voisins à la main** : la règle actuelle de cascade s'applique telle quelle ; un voisin resté rattaché à un autre banc sélectionné doit survivre.
- **Chargement d'un diagramme enregistré** : il s'affiche exactement tel qu'il a été sauvegardé, dépliages compris.

## Open Questions
- Lorsque deux bancs sélectionnés sont directement liés, l'arête entre eux doit-elle être tracée automatiquement (elle ne fait apparaître aucun nœud nouveau, seulement une relation entre deux éléments déjà demandés), ou rester masquée jusqu'à une expansion explicite ? => si afficher leur relation. a la selection d'un banc on affiche les relations qu'il a avec tous les bancs déjà affichés

- Sous quelle forme donner l'indice de découvrabilité : une mention dans l'écran d'accueil du diagramme, une infobulle au premier nœud ajouté, un texte permanent discret dans la barre d'outils ? => non rien

- Faut-il indiquer sur un nœud qu'il possède des relations non affichées (par exemple un compteur ou une pastille), pour que l'utilisateur sache qu'il y a quelque chose à déplier ? Ou est-ce une fonctionnalité distincte, à traiter séparément ? => pas pour l'instant

- Le placement initial de plusieurs bancs sans arêtes doit-il rester confié au moteur radial actuel, ou une disposition plus simple (grille) est-elle préférable pour un ensemble de nœuds isolés ? => moteur radial

## Acceptance Criteria
- [ ] Sélectionner un banc depuis la recherche ajoute exactement un nœud, sans aucun voisin.
- [ ] Sélectionner un banc lié à un banc déjà affiché trace l'arête entre les deux, sans ajouter de troisième nœud.
- [ ] Ouvrir `/depgraph` avec plusieurs bancs déjà sélectionnés affiche uniquement leurs cartes, lisibles et non superposées, avec les seules arêtes qui les relient entre eux.
- [ ] Les actions d'expansion du menu contextuel restent le seul moyen d'afficher un voisin, et fonctionnent comme avant.
- [ ] Sélectionner un banc déjà affiché comme voisin le promeut en racine sans déplier ses relations.
- [ ] Un diagramme enregistré avant cette évolution se recharge à l'identique, avec tous les nœuds et arêtes qu'il contenait.
- [ ] Un nœud amené par une expansion reçoit ses arêtes vers tous les nœuds déjà affichés.
- [ ] Un nœud isolé survit au retrait d'un banc sans rapport avec lui.
- [ ] Aucune régression sur la sauvegarde/chargement, l'export/import, le masquage d'un nœud, le retrait d'un banc et sa cascade, l'aperçu, le lien du titre et la poignée de courbure des liens.
