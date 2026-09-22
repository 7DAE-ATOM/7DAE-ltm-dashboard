# Feature Spec: Redimensionnement des cartes du diagramme par glisser-déposer

## Summary
Permettre à l'utilisateur d'**élargir ou rétrécir individuellement** une carte de banc (lab test mean) dans le diagramme de dépendances (`/depgraph`), en tirant sur son bord gauche ou droit à la souris — exactement comme le fait déjà l'application sœur `C:\projects\airbus\atom\7DAE-app-dashboard` sur sa page Discover pour les rectangles d'application (`components/discover/ApplicationNode.tsx`), et conformément à la capture `temp/a1.jpg` : une zone de préhension invisible sur chaque bord vertical, qui révèle au survol un curseur de redimensionnement et une pastille d'icône, puis suit le pointeur tant que le bouton est maintenu.

La largeur devient ainsi une propriété **par carte**, alors qu'elle est aujourd'hui un réglage **global** (`nodeWidth` dans les réglages d'affichage, appliqué uniformément à toutes les cartes). Les deux doivent coexister : le réglage global reste la largeur par défaut de toute carte que l'utilisateur n'a pas retouchée.

## Motivation
- Les noms de bancs sont longs et hétérogènes. Aujourd'hui ils sont **tronqués à une longueur fixe** pour que chaque carte occupe exactement la boîte réservée par le moteur de placement — sur la capture `temp/d1.jpg` on lit `A350_SA_LR_FIB_WA...`, nom amputé exactement là où il devient informatif. L'utilisateur n'a aucun moyen de voir le nom entier sans quitter le diagramme.
- Le seul recours actuel est d'augmenter la largeur **globale** : toutes les cartes grossissent pour le bénéfice d'une seule, le diagramme s'étale et devient moins lisible. C'est un compromis imposé par l'implémentation, pas un choix de l'utilisateur.
- Un diagramme de dépendances est un document qu'on compose pour le montrer : l'utilisateur déplace déjà les cartes à la main, courbe les liens, choisit ce qu'il affiche. Pouvoir donner plus de place aux quelques bancs qui portent le propos, et laisser les autres compacts, est la suite naturelle de ces gestes.
- L'application sœur a déjà tranché l'ergonomie de ce geste (poignée sur les deux bords verticaux, icône au survol, largeur persistée dans la sauvegarde). Il s'agit de reprendre un dispositif éprouvé, pas d'en inventer un.

## Requirements

### Functional Requirements

#### 1. Les poignées de redimensionnement
- Chaque carte du diagramme porte **deux** zones de préhension, une sur son bord gauche et une sur son bord droit, débordant légèrement de part et d'autre de la bordure.
- Ces zones sont **invisibles au repos** : elles ne doivent rien ajouter au dessin de la carte tant que le pointeur ne les survole pas.
- Au survol, la zone affiche un **curseur de redimensionnement horizontal** et une pastille discrète portant une icône de flèches opposées, comme sur `temp/a1.jpg`.
- Appuyer puis déplacer le pointeur fait suivre la largeur de la carte en **temps réel**, sans latence perceptible et sans attendre le relâchement.
- Le geste se termine au relâchement du bouton, y compris si le pointeur est sorti de la carte ou de la zone du diagramme entre-temps.

#### 2. Ne pas entrer en conflit avec les gestes existants
- Un appui sur une poignée ne doit **pas** déclencher le déplacement de la carte : les deux gestes partent du même appui et doivent rester exclusifs.
- Un appui sur une poignée ne doit pas non plus déclencher la sélection de la carte, son menu contextuel, ni le panoramique du canevas.
- Pendant un redimensionnement, ni le zoom ni la position du canevas ne changent.

#### 3. Bord gauche et bord droit ne se comportent pas pareil
- Tirer le bord **droit** fait grandir la carte vers la droite : son coin supérieur gauche ne bouge pas.
- Tirer le bord **gauche** fait grandir la carte vers la gauche : c'est le bord **droit** qui doit rester immobile à l'écran. La carte doit donc se déplacer d'autant qu'elle grandit, faute de quoi la carte semblerait glisser sous le pointeur au lieu de s'étirer.

#### 4. Limites
- Une carte ne peut pas descendre sous une **largeur minimale** garantissant qu'elle reste lisible et cliquable — au minimum, que son icône de statut et son bandeau d'état ne se chevauchent pas.
- Une largeur maximale, si elle existe, doit être suffisamment large pour laisser lire le plus long nom de banc du catalogue (voir Open Questions).
- Un redimensionnement ne doit jamais produire une largeur nulle, négative ou non finie, quelle que soit la trajectoire du pointeur (sortie de fenêtre, retour en arrière au-delà du bord opposé).

#### 5. Effets sur le reste du diagramme
- Les **liens** attachés à une carte redimensionnée doivent rester accrochés à sa **vraie** bordure, des deux côtés, pendant et après le geste. C'est le point le plus sensible : le calcul des points d'accroche suppose aujourd'hui que **toutes** les cartes ont la même largeur.
- Le **cadrage automatique** (ajustement à la vue, export image) doit tenir compte des largeurs réelles, sinon une carte élargie sortira du cadre.
- Le **placement automatique** et la résolution de chevauchement lors de l'ajout d'une carte doivent également raisonner sur la largeur réelle de chaque carte, et non sur une largeur commune.
- Le **nom affiché** doit profiter de la place gagnée : une carte élargie doit montrer davantage du nom, jusqu'au nom entier. La troncature ne peut donc plus se faire à un nombre de caractères fixe.

#### 6. Articulation avec le réglage global de largeur
- Le réglage global de largeur des cartes reste disponible et reste la largeur **par défaut**.
- Une carte que l'utilisateur n'a **jamais** redimensionnée continue de suivre ce réglage global : la déplacer déplace aussi cette carte.
- Le comportement d'une carte **déjà** redimensionnée lorsque le réglage global change est à trancher (voir Open Questions).
- L'utilisateur doit pouvoir **revenir** à la largeur par défaut pour une carte donnée, sans avoir à viser la largeur d'origine au pixel près (voir Open Questions pour le geste exact).

#### 7. Persistance
- Les largeurs individuelles font partie de la composition du diagramme, au même titre que les positions des cartes et la courbure des liens : elles doivent être **enregistrées dans la sauvegarde** du diagramme et restituées au chargement.
- Une sauvegarde faite **avant** cette fonctionnalité doit se recharger sans erreur : ses cartes reprennent simplement la largeur par défaut.
- Une sauvegarde contenant des largeurs doit rester lisible par une version antérieure de l'application dans la mesure du possible, ou expliciter la montée de version.
- Les largeurs ne doivent **pas** être mémorisées en dehors d'une sauvegarde nommée : recharger la page sur une sélection libre repart des largeurs par défaut, comme c'est déjà le cas pour la courbure des liens.

#### 8. Export
- Les poignées sont un **outil d'édition, pas du contenu** : elles ne doivent pas apparaître dans les exports image (PNG, SVG).
- Les exports image doivent refléter les largeurs réelles des cartes.
- L'export Mermaid n'est pas concerné : il reconstruit le modèle et ignore la mise en page.

### Non-Functional Requirements
- Le suivi du pointeur doit rester **fluide sur un diagramme dense** : un redimensionnement ne doit pas provoquer de recalcul global perceptible à chaque déplacement de souris.
- Aucun appel réseau.
- Rendu correct en thème **clair comme sombre** : la pastille de survol doit rester visible sur les deux fonds.
- Le geste doit rester utilisable sur un écran tactile ou un pavé tactile, ou à défaut ne pas dégrader ce qui fonctionne aujourd'hui.
- L'affordance doit être **découvrable** : un utilisateur qui approche le bord d'une carte doit comprendre qu'elle est redimensionnable, sans documentation.
- **Aucune régression** sur : le déplacement des cartes, la sélection, le menu contextuel, la loupe d'aperçu, le masquage par la légende, les réglages d'affichage, la poignée de courbure des liens, la sauvegarde/chargement et l'export/import JSON, les exports image et Mermaid.

## Scope

### In Scope
- Les poignées de redimensionnement sur les deux bords verticaux des cartes de `/depgraph`.
- La largeur par carte, son application au rendu, aux points d'accroche des liens, au cadrage et au placement.
- L'adaptation de l'affichage du nom à la largeur disponible.
- La persistance des largeurs dans la sauvegarde du diagramme et leur restitution.
- L'exclusion des poignées des exports image.
- Le retour à la largeur par défaut pour une carte.

### Out of Scope
- Redimensionnement **vertical** des cartes : la hauteur reste commune et fixe.
- Redimensionnement sur les pages Catalogue, Map ou Dependency View (`/depview`), dont les vues ne reposent pas sur des cartes rectangulaires placées librement.
- Redimensionnement de plusieurs cartes à la fois, ou alignement/égalisation de largeurs.
- Adaptation automatique de la largeur au contenu ("ajuster au texte").
- Repositionnement automatique des cartes voisines pour éviter un recouvrement créé par un élargissement.
- Suppression ou refonte du réglage global de largeur.
- Modification du moteur de placement automatique initial.

## Affected Areas
- `components/interaction/DependencyGraph.tsx` — l'essentiel du travail :
  - le composant de carte (`NodeCard`), qui lit aujourd'hui `displaySettings.nodeWidth` et doit accueillir les deux poignées ;
  - `truncateLabel()`, dont la longueur fixe est explicitement justifiée par l'hypothèse « toutes les cartes ont la largeur que le moteur de placement a réservée » ;
  - `borderPoint()` et `buildLiveEdges()`, qui reçoivent une largeur unique en paramètre et doivent passer à une largeur par nœud ;
  - le calcul de la boîte englobante (cadrage, export) et la résolution de chevauchement à l'ajout, qui supposent tous deux une largeur commune ;
  - la construction du graphe de placement (`toElkGraph`), qui déclare une largeur identique pour chaque nœud.
- `lib/interactionSaves.ts` — le nœud sauvegardé ne porte aujourd'hui que des coordonnées ; il doit pouvoir porter une largeur facultative, sur le modèle des champs facultatifs déjà ajoutés sans montée de version.
- `lib/diagramImageExport.ts` — exclusion des poignées de la capture ; l'application sœur marque ces éléments par un attribut dédié, convention absente de ce projet.
- `components/icons/` — nouvelle icône de redimensionnement horizontal (le dossier n'en contient pas ; la référence est `ResizeHorizontalIcon` dans l'application sœur).
- `lib/interactionDisplaySettings.ts` — inchangé dans son contenu, mais son `nodeWidth` change de statut : de largeur unique à largeur par défaut.

## Edge Cases
- **Tirer le bord gauche d'une carte** : le bord droit ne doit pas bouger d'un pixel, sinon la carte paraît glisser au lieu de s'étirer.
- **Tirer au-delà du bord opposé** : la largeur se bloque au minimum, la carte ne se retourne pas.
- **Relâchement hors de la fenêtre** (le pointeur sort du navigateur pendant le geste) : le geste doit se terminer proprement, sans rester « collé » au pointeur au retour.
- **Redimensionner puis déplacer la carte** : les deux transformations doivent se composer sans dérive de position.
- **Redimensionner une carte dont les liens partent des quatre côtés** : tous les points d'accroche se recalculent, y compris ceux des liens arrivant par le haut et par le bas.
- **Redimensionner pendant qu'un lien est en cours de courbure** : les deux gestes ne doivent pas se mélanger.
- **Changer le réglage global de largeur après avoir redimensionné des cartes** : comportement à trancher (voir Open Questions), mais il ne doit en aucun cas perdre silencieusement le travail de l'utilisateur.
- **Carte élargie au point d'en recouvrir une voisine** : accepté, l'utilisateur reste maître de sa mise en page ; rien ne doit se réorganiser tout seul.
- **Carte non résolue dans le catalogue** (nœud sans banc correspondant) : elle doit être redimensionnable comme les autres.
- **Chargement d'une sauvegarde ancienne**, sans largeurs : toutes les cartes reprennent la largeur par défaut, sans avertissement.
- **Chargement d'une sauvegarde contenant une largeur aberrante** (négative, nulle, absurde après édition manuelle du fichier) : la valeur est ignorée au profit de la largeur par défaut, comme le font déjà les autres lectures de préférences du projet.
- **Ajustement à la vue après un élargissement** : la carte élargie doit être entièrement dans le cadre.
- **Nom de banc plus court que la largeur** : l'espace gagné ne doit pas produire de mise en page étrange (texte étiré, icônes flottantes).

## Open Questions
- Quel geste ramène une carte à sa largeur par défaut : un double-clic sur la poignée, une entrée dans le menu contextuel de la carte, les deux ? => rien

- Une carte déjà redimensionnée doit-elle suivre un changement ultérieur du réglage **global** de largeur, ou garder sa largeur propre ? (Suivre le global = perte du travail manuel ; l'ignorer = le curseur global semble ne rien faire sur certaines cartes.) => ignorer

- Existe-t-il une largeur **maximale** ? Si oui, sur quel critère — une valeur absolue, un multiple de la largeur par défaut, la largeur du plus long nom ? => non

- Le **nom** doit-il, sur une carte élargie, se dévoiler progressivement (troncature calculée d'après la largeur) ou passer sur plusieurs lignes ? La hauteur restant fixe, une seconde ligne suppose de revoir la mise en page interne de la carte. => se dévoiler progressivement

- Le redimensionnement doit-il être proposé aussi pour les cartes de type ressource partagée (`SHARE`), ou seulement pour les bancs ? => oui également

- Faut-il, à l'image de l'application sœur, empêcher qu'un bord franchisse un élément attaché à la carte ? Ce projet n'a pas l'équivalent des cercles d'interface, donc la contrainte est peut-être sans objet ici. => non

- La largeur sauvegardée doit-elle être enregistrée pour **toutes** les cartes ou seulement pour celles qui s'écartent de la largeur par défaut ? (La seconde option garde les sauvegardes compactes et lisibles, et fait qu'un diagramme jamais redimensionné produit un fichier inchangé.) => seconde option

- La sauvegarde doit-elle monter de version, ou la largeur peut-elle être un champ facultatif de plus, comme l'ont été le type de dépendance et la courbure ? => champ facultatif de plus

## Acceptance Criteria
- [ ] Survoler le bord gauche ou droit d'une carte de `/depgraph` révèle un curseur de redimensionnement et une pastille d'icône ; au repos, rien n'est visible.
- [ ] Maintenir le bouton et déplacer le pointeur redimensionne la carte en temps réel.
- [ ] Le geste ne déplace pas la carte, ne la sélectionne pas, n'ouvre pas son menu contextuel et ne déplace pas le canevas.
- [ ] Tirer le bord droit laisse le bord gauche immobile ; tirer le bord gauche laisse le bord droit immobile.
- [ ] La carte ne peut pas devenir plus étroite que la largeur minimale, ni se retourner si le pointeur dépasse le bord opposé.
- [ ] Relâcher hors de la fenêtre termine proprement le geste.
- [ ] Les liens restent accrochés aux vraies bordures de la carte redimensionnée, pendant et après le geste, sur les quatre côtés.
- [ ] Une carte élargie montre davantage de son nom, jusqu'au nom entier.
- [ ] L'ajustement à la vue et les exports image cadrent correctement une carte élargie.
- [ ] Les poignées n'apparaissent pas dans les exports PNG et SVG.
- [ ] L'utilisateur peut ramener une carte à sa largeur par défaut.
- [ ] Une carte jamais redimensionnée suit le réglage global de largeur.
- [ ] Sauvegarder puis recharger un diagramme restitue les largeurs individuelles.
- [ ] Une sauvegarde antérieure à la fonctionnalité se recharge sans erreur, toutes cartes à la largeur par défaut.
- [ ] Une largeur aberrante dans un fichier de sauvegarde est ignorée au profit de la largeur par défaut.
- [ ] Aucune régression sur le déplacement des cartes, la courbure des liens, le menu contextuel, la loupe d'aperçu, la légende, les réglages d'affichage et l'export/import JSON.
