# Feature Spec: Alignement UX sur 7DAE-app-dashboard (filtres partagés, densité catalogue, interactions graphe)

## Summary
Reprendre dans `7DAE-ltm-dashboard` un ensemble d'améliorations déjà implémentées dans l'application sœur `C:\projects\airbus\atom\7DAE-app-dashboard`, autour de quatre axes :

1. **Un panneau de filtres unique et cohérent** sur les onglets **Catalogue** (`/`), **Map** (`/map`) et **Dependency View** (`/depview`) : même contenu, même taille, même position, chapitres repliables/dépliables, absorption du filtre « Displayed LTM » aujourd'hui propre à Dependency View, et conservation de la sélection **et** de l'état plié/déplié lors des navigations entre ces trois pages.
2. **Une densité d'affichage configurable** sur la page Catalogue : nombre de cartes par ligne et nombre de lignes par page, comme dans la référence.
3. **Des interactions enrichies sur les diagrammes** : poignée ronde sur les liens du **Dependency Graph** (`/depgraph`) pour en courber le tracé au drag-and-drop, et lien depuis le titre d'un banc vers sa fiche de détail, aussi bien sur **Dependency Graph** que sur **Dependency View**.
4. **Un bloc « ACTIONS »** sur le Catalogue : export PDF de la sélection courante, et icône ouvrant les bancs de cette sélection dans le Dependency Graph.

Cette spec **consolide et remplace** les notes antérieures `filterbar-parity-map-catalogue.md`, `filter-panel-actions-and-shared-state.md` et `shared-filter-panel-catalogue-map-dependency-view.md`, en y ajoutant les demandes nouvelles (poignée de courbure des liens, liens vers la fiche de détail depuis les diagrammes, icône « ouvrir dans Dependency Graph »).

## Motivation
- Les trois pages Catalogue, Map et Dependency View exploitent déjà le même jeu de données et le même composant de filtres, mais leur panneau n'a ni la même taille ni la même position, et Dependency View ajoute son propre bloc « Displayed LTM » en dehors du panneau — l'utilisateur perd ses repères d'un onglet à l'autre.
- Refaire la même sélection de filtres à chaque changement d'onglet est un irritant quotidien : un utilisateur qui a isolé « les bancs opérationnels de Toulouse » sur le Catalogue veut retrouver exactement cette sélection sur la Map et sur Dependency View.
- Avec beaucoup d'axes de filtre, le panneau devient très long : la référence a résolu le problème avec des chapitres repliables dont l'état est mémorisé.
- La grille du Catalogue est aujourd'hui figée ; selon l'écran et l'usage (survol rapide vs comparaison détaillée), l'utilisateur veut voir plus ou moins de cartes à la fois.
- Sur les diagrammes, deux manques : impossible de désencombrer des tracés qui se superposent, et impossible d'atteindre la fiche d'un banc depuis le diagramme sans repasser par le Catalogue.
- Après avoir filtré le Catalogue, le chemin naturel est soit d'exporter la sélection, soit de la visualiser en dépendances — les deux actions doivent être à portée de clic depuis le panneau.

## Requirements

### Functional Requirements

#### 1. Panneau de filtres identique sur Catalogue, Map et Dependency View
- Les trois pages présentent **le même panneau de filtres** : mêmes chapitres, même ordre, même habillage (cadre, en-têtes de bloc, style des puces et des bascules).
- La **taille** (largeur, gouttières, hauteur d'en-tête) et la **position** du panneau sont identiques sur les trois pages, en desktop comme en mobile.
- Les réglages propres à une page qui ne sont pas des filtres (réglages d'affichage du radar, du diagramme, du fond de carte, cache photo) restent en dehors du panneau, à leur emplacement actuel.

#### 2. Le filtre « Displayed LTM » intégré au panneau partagé
- Le bloc « Displayed LTM », aujourd'hui rendu hors panneau et uniquement sur Dependency View, devient un **chapitre du panneau de filtres partagé**, avec le même habillage que les autres chapitres (en-tête repliable, compteur du type `Displayed LTM (n/N)`).
- Son comportement fonctionnel actuel est conservé : liste des bancs, bascule de visibilité banc par banc, compteur affiché/total.
- Ce chapitre est présent sur les trois pages. Masquer un banc via ce chapitre le retire de la vue courante quelle qu'elle soit (cartes du Catalogue, marqueurs de la Map, nœuds de Dependency View), et cette liste de bancs masqués fait partie de l'état partagé entre les trois pages.

#### 3. Chapitres repliables / dépliables
- Chaque chapitre du panneau peut être replié ou déplié individuellement, par un clic sur son en-tête, comme dans `7DAE-app-dashboard`.
- Un chapitre replié dont l'axe est actif indique dans son en-tête le nombre de valeurs sélectionnées, pour qu'aucun filtre actif ne soit invisible.
- L'état plié/déplié de chaque chapitre est mémorisé et **partagé entre les trois pages** : replier « Country » sur le Catalogue le laisse replié en arrivant sur la Map ou sur Dependency View.
- L'état plié/déplié survit également au rechargement de la page.

#### 4. Sélection de filtres conservée entre les pages
- Les axes communs (recherche, type, statut, pays, programme avion, complexité, portfolio, photo, quality seal) partagent **une seule sélection active** quelle que soit la page où elle est modifiée.
- Naviguer de Catalogue vers Map vers Dependency View (et retour) conserve la sélection à l'identique, sans re-saisie et sans réinitialisation.
- L'action « réinitialiser les filtres » remet à zéro cette sélection partagée pour les trois pages à la fois ; elle ne touche pas à la densité d'affichage du Catalogue.

#### 5. Densité d'affichage configurable sur le Catalogue
- Le Catalogue propose un contrôle **« cartes par ligne »** (jeu de valeurs aligné sur la référence, p. ex. 3 / 5 / 8) et un contrôle **« lignes par page »** (1 à 10, plus une option « Tout » qui affiche l'intégralité du résultat filtré sans pagination).
- La taille de page effective est le produit cartes-par-ligne × lignes-par-page, de sorte qu'une page se termine toujours sur une ligne complète (sauf la dernière page du résultat).
- Au-delà d'un certain nombre de cartes par ligne, les cartes basculent dans une variante compacte pour rester lisibles.
- Le réglage de densité est mémorisé d'une visite à l'autre. Ce n'est **pas** un filtre : il n'apparaît pas dans l'URL et n'est pas remis à zéro par « réinitialiser les filtres ».
- La pagination existante reste cohérente avec la densité choisie : changer la densité ne doit pas laisser l'utilisateur sur une page vide.

#### 6. Bloc « ACTIONS » sur le Catalogue
- Un bloc **« ACTIONS »** est ajouté en haut du panneau de filtres du Catalogue, au-dessus des chapitres de filtre, présenté comme dans la référence (boutons ronds à icône, avec infobulle portant le libellé complet et le nombre d'éléments concernés).
- Action 1 — **Export PDF** : exporte la sélection courante, en réutilisant l'export PDF déjà en place. Pendant la génération, l'icône passe en état « en cours » et l'action est inactive.
- Action 2 — **Ouvrir dans Dependency Graph** : ouvre les bancs de la sélection courante dans `/depgraph`, qui les prend comme racines du diagramme.
- Les deux actions sont inactives (visuellement et au clavier) quand la sélection courante est vide.

#### 7. Poignée de courbure des liens sur Dependency Graph
- Sur `/depgraph`, chaque lien du diagramme expose une **poignée ronde positionnée sur le tracé**, qui permet par drag-and-drop de courber ce lien et d'en déplacer la ligne, comme dans `7DAE-app-dashboard`.
- Un lien sans courbure explicite suit le réglage global d'affichage du diagramme ; la poignée crée un écart propre à ce lien.
- La courbure ainsi réglée est **propre à la session** : elle n'est pas persistée d'une visite à l'autre, à l'exception d'un **enregistrement nommé** de diagramme, qui doit la restituer telle quelle au rechargement.
- Le diagramme doit considérer une courbure modifiée comme une modification non enregistrée, au même titre qu'un déplacement de nœud.

#### 8. Lien du titre d'un banc vers sa fiche de détail
- Sur **Dependency Graph** (`/depgraph`), le titre d'un banc dans un nœud du diagramme est un lien vers la fiche de détail de ce banc (`/labtestmean?id=<externalId>`).
- Sur **Dependency View** (`/depview`), le titre d'un banc est également un lien vers sa fiche de détail.
- Le lien doit rester distinguable des interactions propres au diagramme : cliquer le titre navigue, alors que cliquer ailleurs dans le nœud conserve le comportement actuel (sélection, déplacement, menu contextuel).

### Non-Functional Requirements
- Aucune régression sur l'existant : filtrage actuel, export PDF, pagination, sauvegarde/chargement et export/import de diagrammes, menu contextuel des nœuds, réglages d'affichage du diagramme et du radar, réglages de cache photo.
- Le panneau et les nouveaux contrôles restent lisibles et utilisables en thème clair comme en thème sombre, et compatibles avec les deux axes de thème déjà en place (préférence clair/sombre et classe de thème de route).
- Le panneau et les nouveaux contrôles restent utilisables au clavier et correctement étiquetés pour les lecteurs d'écran (chapitres repliables, boutons d'action, poignées de lien, liens de titre).
- Les interactions de drag-and-drop sur les liens doivent rester fluides sur un diagramme de taille réaliste — seul le lien manipulé doit se redessiner pendant le glissement.
- Le mode « Tout » de la densité Catalogue doit rester utilisable sur le jeu de données réel, quitte à accepter un rendu plus lent assumé par l'utilisateur qui choisit ce mode.
- La densité choisie doit être appliquée dès le premier rendu, sans saut visuel après hydratation.

## Scope

### In Scope
- Unification visuelle et fonctionnelle du panneau de filtres sur `/`, `/map` et `/depview`.
- Intégration du bloc « Displayed LTM » comme chapitre du panneau partagé.
- Chapitres repliables avec état mémorisé et partagé entre les trois pages.
- Partage de la sélection de filtres entre les trois pages.
- Contrôles de densité (cartes par ligne, lignes par page) sur le Catalogue et adaptation de la pagination.
- Bloc « ACTIONS » du Catalogue : export PDF et ouverture de la sélection dans Dependency Graph.
- Poignée de courbure au drag-and-drop sur les liens de `/depgraph`, y compris sa restitution dans les enregistrements nommés de diagramme.
- Lien du titre de banc vers la fiche de détail sur `/depgraph` et `/depview`.

### Out of Scope
- Toute fonctionnalité « Show in Discover » ou équivalent importée telle quelle de la référence : seules les deux actions décrites ci-dessus sont retenues.
- Ajout du panneau de filtres partagé sur `/depgraph`, qui garde sa propre barre de sélection de bancs racines — la demande porte sur Catalogue, Map et Dependency View.
- Modification du moteur de placement des nœuds du diagramme, du menu contextuel, ou du format de sauvegarde au-delà de ce qu'exige la restitution de la courbure des liens.
- Densité configurable sur Map ou Dependency View.
- Modification des sources de données, de l'adaptateur backend ou du contrat de l'API `atom-synchronizer-dev`.
- Refonte de la fiche de détail elle-même.

## Affected Areas
- `components/FilterBar.tsx`, `components/FilterSheet.tsx` — chapitres repliables, bloc ACTIONS, chapitre « Displayed LTM », uniformisation de la taille et de la position.
- `components/CatalogueClient.tsx`, `components/MapClient.tsx`, `components/RadarClient.tsx` — branchement sur le panneau partagé et sur la sélection partagée.
- `components/radar/BenchVisibilityList.tsx`, `components/radar/CollapsibleSection.tsx` — logique de visibilité des bancs déplacée dans le chapitre partagé.
- `lib/catalogueFilters.ts` — sélection de filtres élargie aux trois pages, plus la liste des bancs masqués.
- Nouveau module de persistance de l'état plié/déplié des chapitres (équivalent de `lib/filterSectionState.ts` côté référence).
- Nouveau module de densité du Catalogue (équivalent de `lib/catalogueDensity.ts`), `components/Pagination.tsx`, `lib/usePageQuery.ts`, `components/LabTestMeanCard.tsx` (variante compacte), et le script anti-FOUC de `app/layout.tsx` si la densité doit être appliquée avant le premier paint.
- Nouveau composant d'actions du Catalogue (équivalent de `components/CatalogueActions.tsx`), s'appuyant sur `components/ExportPdfButton.tsx` / `lib/useExportPdf.ts`, plus une icône dans `components/icons/`.
- `components/interaction/DependencyGraph.tsx` et un nouveau module de courbure par lien (équivalent de `lib/discoverEdgeCurvature.ts`), `components/interaction/SaveLoadControls.tsx` et `lib/interactionSaves.ts` pour la restitution dans les enregistrements nommés.
- `components/interaction/DependencyGraph.tsx` et `components/radar/CircularGraph.tsx` — titre de banc cliquable vers `/labtestmean?id=`.

## Edge Cases
- Sélection vide : les deux actions du bloc ACTIONS sont inactives et l'indiquent clairement, plutôt que d'exporter un PDF vide ou d'ouvrir un diagramme sans racine.
- Sélection très large ouverte dans Dependency Graph : un garde-fou doit éviter de construire un diagramme ingérable (limite explicite, message, ou troncature annoncée — à trancher, voir Open Questions).
- Un banc masqué via « Displayed LTM » puis exporté en PDF ou ouvert dans Dependency Graph : il doit être traité comme exclu de la sélection, de manière cohérente avec ce que l'utilisateur voit à l'écran.
- Changement de densité alors que l'utilisateur est sur la dernière page : la page courante doit être ramenée dans les bornes valides.
- Mode « Tout » combiné à une sélection vide de filtres sur le jeu de données complet : le rendu doit rester possible et la page rester réactive.
- Courbure d'un lien dont un des deux nœuds est ensuite déplacé ou retiré du diagramme : la courbure doit suivre le tracé ou être abandonnée proprement, sans tracé fantôme.
- Chargement d'un enregistrement de diagramme antérieur à cette évolution, donc sans information de courbure : les liens reprennent le réglage global, sans erreur.
- Clic sur le titre d'un banc pendant un déplacement de nœud ou une manipulation du diagramme : la navigation ne doit pas se déclencher par accident.
- Stockage indisponible (navigation privée, quota dépassé) : sélection partagée, état plié/déplié et densité se dégradent en mode session uniquement, sans erreur bloquante.
- Bancs dont le site n'est pas reconnu par l'adaptateur (donc absents de la Map) : leur présence ou absence dans le compteur « Displayed LTM » doit rester cohérente entre les trois pages.

## Open Questions
- Le bloc « ACTIONS » doit-il apparaître aussi sur Map et Dependency View (avec les mêmes deux actions), ou rester propre au Catalogue comme formulé dans la demande ? => propre au catalogue

- Quelle limite appliquer au nombre de bancs transmis de la sélection Catalogue vers Dependency Graph, et que faire au-delà : bloquer, avertir, ou tronquer ? => pas de limite pour l'instant, mais avertir avec un popup de confirmation au dela de 30 bancs

- La liste des bancs masqués via « Displayed LTM » doit-elle vraiment agir sur le Catalogue et la Map, ou seulement y être visible tout en n'affectant que Dependency View ? => Oui agit partout

- Les valeurs de densité doivent-elles reprendre exactement celles de la référence (3 / 5 / 8 cartes par ligne, 1 à 10 lignes) ou être adaptées à la carte LTM, plus large que la carte application ? => pour l'instant même densité

- La sélection partagée doit-elle rester reflétée dans l'URL de chaque page (pour le partage de lien) ou uniquement dans le stockage local ?=> même philosophie que sur 7DAE-app-dashboard, partage de lien jusqu'à un cetains nombre aprés stockage local uniquement

- Sur Dependency View, le titre cliquable doit-il ouvrir la fiche de détail dans le même onglet ou dans un nouvel onglet, sachant que l'utilisateur perdrait sinon la configuration du diagramme en cours ? => autre onglet

## Acceptance Criteria
- [ ] Le panneau de filtres a le même contenu, le même habillage, la même taille et la même position sur Catalogue, Map et Dependency View.
- [ ] « Displayed LTM » est un chapitre du panneau partagé, présent sur les trois pages, avec son compteur affiché/total et sans perte de comportement.
- [ ] Chaque chapitre du panneau se replie et se déplie individuellement ; l'état est identique sur les trois pages et survit au rechargement.
- [ ] Un chapitre replié dont l'axe est actif signale le nombre de valeurs sélectionnées dans son en-tête.
- [ ] Modifier un filtre sur l'une des trois pages le retrouve inchangé sur les deux autres après navigation.
- [ ] Le Catalogue propose un contrôle « cartes par ligne » et un contrôle « lignes par page » (option « Tout » incluse) ; le réglage est mémorisé et n'est pas réinitialisé par « réinitialiser les filtres ».
- [ ] La grille et la pagination du Catalogue respectent la densité choisie, sans page vide ni saut visuel au chargement.
- [ ] Le bloc « ACTIONS » du Catalogue expose l'export PDF et l'ouverture de la sélection dans Dependency Graph, les deux inactifs quand la sélection est vide.
- [ ] Sur `/depgraph`, chaque lien expose une poignée ronde sur son tracé permettant de le courber au drag-and-drop ; la courbure est restituée au chargement d'un enregistrement nommé.
- [ ] Sur `/depgraph` et `/depview`, le titre d'un banc mène à sa fiche de détail, sans perturber les interactions existantes du diagramme.
- [ ] Aucune régression sur le filtrage, l'export PDF, la pagination, la sauvegarde/chargement de diagrammes et les réglages d'affichage existants.
