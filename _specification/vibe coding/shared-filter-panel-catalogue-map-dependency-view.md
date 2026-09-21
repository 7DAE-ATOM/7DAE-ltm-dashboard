# Feature Spec: Unification et enrichissement du panneau de filtres (Catalogue / Map / Dependency View)

## Summary
- Nouvelle analyse du projet de référence `C:\projects\airbus\atom\7DAE-app-dashboard` (board applicatif de la même famille que `ltm-dashboard`) pour étendre et enrichir le panneau de filtres partagé (`FilterBar`/`FilterSheet`) sur **trois** pages : Catalogue, Map, et **Dependency View** (`/depgraph`, `InteractionClient.tsx`), au lieu de deux.
- Cette spec **élargit** la spec précédente `filter-panel-actions-and-shared-state.md` (bloc "ACTIONS" avec icône Export PDF, chapitres repliables persistés, sélection de filtres partagée) en y ajoutant :
  1. La même charte visuelle du panneau (encadrement des chapitres, style des en-têtes) sur les trois pages, même si les axes de filtre disponibles diffèrent d'une page à l'autre.
  2. La synchronisation de la sélection de filtres entre les **trois** pages (et non plus seulement Catalogue ↔ Map).
  3. La zone "Display LTM" de Dependency View (aujourd'hui une barre séparée : recherche + liste des bancs sélectionnés comme racines du diagramme) traitée comme un chapitre de filtre supplémentaire du même composant partagé.
  4. L'affichage, sur chaque valeur de chaque chapitre de filtre, du nombre de LTM que cette valeur représenterait si elle était sélectionnée — comme le fait déjà `7DAE-app-dashboard` sur ses filtres d'applications (mécanisme `previewCount`).
  5. Une densité d'affichage configurable pour la grille de la page Catalogue : nombre de cartes par ligne et nombre de lignes par page (au lieu de la taille de page fixe actuelle).

## Motivation
- Le panneau de filtres est déjà partagé (même composant `FilterBar`) entre Catalogue et Map, mais Dependency View utilise un mécanisme totalement différent (`BenchCombobox` + `SelectedBenchesBar` dans une barre d'outils séparée) pour choisir quels bancs afficher dans le diagramme — ce qui casse la cohérence visuelle et empêche de profiter des mêmes filtres par type/statut/pays/etc. pour restreindre la recherche de bancs à ajouter au diagramme.
- Un utilisateur qui a déjà filtré le Catalogue (ex. seulement les bancs "operational" en France) doit aujourd'hui ressaisir ces mêmes critères s'il veut construire un diagramme de dépendances limité aux mêmes bancs.
- Sans indication du nombre de LTM par valeur de filtre, l'utilisateur ne sait pas à l'avance si cocher une case supplémentaire va beaucoup ou peu réduire la liste — la référence `7DAE-app-dashboard` résout déjà ce problème.
- La page Catalogue affiche aujourd'hui une taille de page fixe (6 cartes) et une grille responsive non configurable ; certains utilisateurs préféreraient voir plus ou moins de cartes à la fois, comme le permet déjà la référence (3/5/8 cartes par ligne, 1 à 10 lignes ou "Tout" par page).

## Requirements

### Functional Requirements

#### 1. Bloc "ACTIONS" avec icône Export PDF (reprise, portée élargie)
- Comme décrit dans `filter-panel-actions-and-shared-state.md` : bloc "ACTIONS" en haut du panneau, bouton rond avec tooltip, sans "Show in Discover".
- Ce bloc reste piloté par page (chaque page peut fournir ou non son propre contenu d'actions au composant partagé) — Dependency View n'a pas nécessairement besoin d'un Export PDF si cette action n'a pas de sens pour un diagramme (voir Open Questions).

#### 2. Chapitres de filtres repliables/dépliables, état partagé (reprise, portée élargie)
- Chaque chapitre du panneau (axes existants de Catalogue/Map, plus les nouveaux axes de Dependency View) devient replié/déplié individuellement, avec mémorisation persistée et **partagée entre les trois pages** (Catalogue, Map, Dependency View) et leurs éventuelles instances mobiles.
- Par défaut, tous les chapitres sont repliés à la première visite.

#### 3. Même habillage visuel sur les trois pages, malgré des filtres différents
- Le panneau de filtres (cadre, titres de bloc "ACTIONS"/"FILTERING", style des chapitres repliables, style des puces/toggles) doit avoir un rendu visuel identique sur Catalogue, Map et Dependency View.
- Chaque page ne montre que les chapitres qui la concernent (ex. Dependency View n'a pas forcément besoin de tous les axes de Catalogue/Map si certains n'ont pas de sens pour construire un diagramme — à confirmer, voir Open Questions), mais les chapitres communs utilisent le même composant et le même style.

#### 4. Synchronisation de la sélection de filtres entre Catalogue, Map et Dependency View
- Les axes de filtre communs (recherche, type, statut, pays, portfolio, complexité, programme avion, photo, quality seal) partagent une seule et même sélection active, quelle que soit la page sur laquelle l'utilisateur les modifie.
- Un filtre appliqué sur Catalogue doit immédiatement se refléter sur Map et sur Dependency View (et réciproquement dans les deux sens, entre les trois pages).

#### 5. La zone "Display LTM" de Dependency View devient un chapitre du panneau partagé
- La sélection explicite des bancs affichés comme racines du diagramme (aujourd'hui la combinaison recherche + liste de bancs sélectionnés, rendue dans une barre séparée en haut de `/depgraph`) devient un chapitre supplémentaire du même composant de panneau de filtres partagé, avec le même habillage (repliable, en-tête avec compteur) que les autres chapitres.
- Le comportement fonctionnel de cette sélection (recherche d'un banc par nom/code, ajout, retrait, exclusion des bancs déjà sélectionnés, synchronisation avec l'URL `?ids=`) est conservé tel quel — seul son emplacement et son habillage visuel changent.

#### 6. Nombre de LTM affiché sur chaque valeur de filtre
- Chaque valeur proposée dans un chapitre de filtre (ex. chaque type, chaque statut, chaque pays, chaque portfolio, chaque niveau de complexité, chaque programme avion) affiche le nombre de LTM qui resteraient visibles si cette valeur était ajoutée/retirée de la sélection courante — même mécanisme que les compteurs déjà affichés sur les filtres d'applications de `7DAE-app-dashboard`.
- Ce compteur reste cohérent avec le jeu de données affiché sur la page courante (Catalogue/Map filtrent la même liste de LTM ; Dependency View, s'il partage aussi ces axes, doit afficher un compteur cohérent avec son propre contexte).

#### 7. Densité d'affichage configurable sur la page Catalogue
- Ajout d'un contrôle "cartes par ligne" (ex. 3 / 5 / 8) et d'un contrôle "lignes par page" (ex. 1 à 10, ou "Tout" pour tout afficher sans pagination), inspirés de `ColumnsToggle`/`Pagination` de `7DAE-app-dashboard`.
- La taille de page effective résulte du produit cartes-par-ligne × lignes-par-page (sauf en mode "Tout").
- Ce réglage de densité est mémorisé d'une visite à l'autre.

### Non-Functional Requirements
- Aucune régression sur les fonctionnalités existantes de Dependency View : ajout/retrait de bancs, sauvegarde/chargement de diagrammes, export/import, menu contextuel des nœuds, réglages d'affichage du diagramme (`DisplaySettingsControl`, à ne pas confondre avec le nouveau chapitre "Display LTM").
- Aucune régression sur l'export PDF existant (Catalogue, Map) ni sur le filtrage déjà en place.
- Le panneau doit rester lisible et utilisable en clair/sombre, desktop/mobile, sur les trois pages.
- Les nouveaux compteurs par valeur de filtre ne doivent pas dégrader sensiblement la réactivité du panneau sur le jeu de données réel (recalcul à chaque interaction, comme dans la référence).

## Scope

### In Scope
- `components/FilterBar.tsx` / `components/FilterSheet.tsx` : chapitres repliables, bloc "ACTIONS", compteurs par valeur, nouveau chapitre "Display LTM".
- `components/CatalogueClient.tsx`, `components/MapClient.tsx`, `components/InteractionClient.tsx` : intégration au panneau partagé, synchronisation de la sélection de filtres entre les trois pages.
- Persistance/partage de l'état plié-déplié des chapitres, de la sélection de filtres, et de la densité d'affichage du Catalogue.
- Ajout des contrôles "cartes par ligne" / "lignes par page" sur la page Catalogue.

### Out of Scope
- Toute fonctionnalité "Show in Discover" ou équivalent.
- Modification du moteur de layout du diagramme de dépendances (ELK, positions des nœuds), du menu contextuel des nœuds, ou du mécanisme de sauvegarde/chargement/export/import des diagrammes.
- Modification des réglages d'affichage visuel des boîtes du diagramme (`DisplaySettingsControl` — quality seal tag, type, ville, statut, bâtiment, salle, largeur de boîte), qui reste un contrôle séparé et n'a rien à voir avec le nouveau chapitre "Display LTM".
- Densité d'affichage configurable pour la page Map ou pour Dependency View — demandée uniquement pour Catalogue.

## Affected Areas
- `components/FilterBar.tsx`, `components/FilterSheet.tsx` — chapitres repliables, bloc ACTIONS, compteurs, nouveau chapitre.
- `components/CatalogueClient.tsx`, `components/MapClient.tsx`, `components/InteractionClient.tsx` — branchement sur la sélection de filtres partagée et sur le nouveau panneau.
- `components/interaction/BenchCombobox.tsx`, `components/interaction/SelectedBenchesBar.tsx` — logique réutilisée dans le nouveau chapitre "Display LTM" plutôt que dans la barre d'outils séparée actuelle.
- `lib/catalogueFilters.ts` — évolution vers une sélection partagée entre les trois pages (et non plus seulement Catalogue).
- Nouveau module de persistance de l'état plié/déplié des chapitres (déjà identifié dans la spec précédente).
- Nouveau module de densité d'affichage du Catalogue (équivalent de `lib/catalogueDensity.ts` côté référence), et adaptation de `components/Pagination.tsx`.
- `components/ExportPdfButton.tsx` / `lib/useExportPdf.ts` — logique déjà en place, réutilisée pour le bloc ACTIONS.

## Edge Cases
- Un chapitre replié affichant un axe déjà actif doit toujours montrer le nombre de valeurs actives dans son en-tête (déjà couvert par la spec précédente).
- Naviguer de Dependency View vers Catalogue/Map avec des bancs déjà sélectionnés comme racines de diagramme : la sélection de filtres attributaires (type/statut/etc.) doit rester synchronisée, mais la sélection de bancs spécifiques ("Display LTM") reste propre à Dependency View et à son état d'URL (`?ids=`) — elle ne doit pas se propager comme un filtre attributaire vers Catalogue/Map.
- Filtrer par attribut (ex. pays) de façon à exclure un banc déjà sélectionné comme racine d'un diagramme existant sur Dependency View : à définir si le banc reste affiché dans le diagramme malgré tout (voir Open Questions).
- Mode "Tout" pour les lignes par page sur un jeu de données très large : la page doit rester utilisable (pas de blocage du rendu), quitte à accepter un temps de rendu plus long assumé par l'utilisateur qui choisit ce mode.
- Stockage indisponible (navigation privée, quota dépassé) : chapitres repliés, sélection de filtres partagée et densité d'affichage doivent tous se dégrader proprement en mode session-uniquement, sans erreur bloquante.

## Open Questions
- Le nouveau chapitre "Display LTM" doit-il apparaître uniquement sur Dependency View, ou aussi (grisé/inactif) sur Catalogue et Map qui n'ont pas de notion de bancs racines de diagramme ?
- Si un banc sélectionné comme racine d'un diagramme sur Dependency View sort du résultat des filtres attributaires partagés (ex. changement de pays sélectionné), doit-il rester affiché dans le diagramme existant, ou doit-il en être retiré automatiquement ?
- Le bloc "ACTIONS" (Export PDF) a-t-il un sens sur Dependency View, ou doit-il rester absent de cette page (qui a déjà son propre export de diagramme via `SaveLoadControls`) ?
- Dependency View doit-elle recevoir tous les axes de filtre de Catalogue/Map (type, statut, pays, portfolio, complexité, programme avion, photo, quality seal), ou seulement un sous-ensemble pertinent pour restreindre la recherche de bancs à ajouter au diagramme ?

## Acceptance Criteria
- [ ] Le panneau de filtres a le même habillage visuel (cadre, blocs, chapitres repliables) sur Catalogue, Map et Dependency View.
- [ ] Modifier un filtre attributaire sur l'une des trois pages le répercute immédiatement sur les deux autres.
- [ ] L'état plié/déplié de chaque chapitre est identique et persiste sur les trois pages.
- [ ] La sélection de bancs racines du diagramme sur Dependency View est présentée comme un chapitre du panneau partagé, avec le même habillage que les autres chapitres, sans perte de son comportement actuel (recherche, ajout, retrait, synchronisation URL).
- [ ] Chaque valeur de chaque chapitre de filtre affiche le nombre de LTM qu'elle représenterait si elle était sélectionnée.
- [ ] La page Catalogue propose un contrôle "cartes par ligne" et un contrôle "lignes par page" (avec option "Tout"), dont le réglage est mémorisé.
- [ ] Aucune régression sur l'export PDF, le filtrage existant, ni sur les fonctionnalités propres à Dependency View (sauvegarde/chargement, export/import, menu contextuel, réglages d'affichage du diagramme).
