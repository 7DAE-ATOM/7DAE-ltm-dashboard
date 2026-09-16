# Feature Spec: Parité du panneau de filtres entre Catalogue et Map

## Summary
- Le composant de filtres (`FilterBar`/`FilterSheet`) est **déjà** le même code partagé entre la page Catalogue (`CatalogueClient.tsx`) et la page Map (`MapClient.tsx`) — ce n'est pas un composant dupliqué. La différence visuelle perçue vient du **conteneur** autour du `FilterBar`, qui diffère entre les deux pages : un panneau flottant en absolu sur Map (avec titre "Lab test means by location" et un texte de comptage), contre un panneau ancré (`sticky`) sans titre sur Catalogue.
- L'action "Export PDF" n'existe aujourd'hui que sur la page Catalogue (`CatalogueClient.tsx`), pas sur Map.
- Le titre affiché au-dessus du `FilterBar` sur la page Map ("Lab test means by location") doit être supprimé.

## Motivation
- L'utilisateur perçoit une incohérence visuelle entre les deux pages alors qu'il s'attend à un panneau de filtres identique des deux côtés, ce qui nuit à la cohérence de l'interface.
- L'export PDF est une fonctionnalité utile qui devrait être disponible partout où le `FilterBar` filtre une liste de bancs, y compris sur la carte.
- Le titre "Lab test means by location" (avec, en dessous, le texte de comptage / message d'absence de données) alourdit visuellement le panneau flottant de la carte sans apporter d'information indispensable.

## Requirements

### Functional Requirements

#### 1. Harmoniser le conteneur du panneau de filtres entre Catalogue et Map
- Le panneau de filtres de la page Map doit adopter la même présentation visuelle (habillage, style, positionnement relatif à la mise en page) que celui de la page Catalogue, en réutilisant le même wrapper/style plutôt qu'un style ad hoc dupliqué.
- Le `FilterBar` et le `FilterSheet` restent le composant partagé unique — aucune divergence de comportement de filtrage entre les deux pages.

#### 2. Supprimer le titre "Lab test means by location" de la page Map
- Le titre affiché au-dessus du `FilterBar` sur la page Map doit disparaître.
- Le texte de comptage ("X of Y shown on map" / message d'absence de résultats) est conservé sous une forme cohérente avec ce qui est affiché sur la page Catalogue (ex. "X / Y lab test means").

#### 3. Ajouter l'action "Export PDF" sur la page Map
- Le bouton/action d'export PDF, identique en comportement à celui de la page Catalogue (génère un PDF des bancs actuellement visibles selon les filtres appliqués), doit aussi être disponible sur la page Map.
- L'export doit refléter l'ensemble des bancs visibles sur la carte après application des filtres (même logique de filtrage que Catalogue), pas seulement ceux visibles dans le viewport de la carte.

### Non-Functional Requirements
- Aucune régression sur le comportement de filtrage existant (Catalogue et Map) : mêmes filtres, mêmes valeurs, même logique de correspondance.
- Aucune régression sur le comportement d'export PDF existant sur Catalogue (nom de fichier, confirmation avant export "tout", récupération des photos de couverture).
- Le panneau de filtres doit rester utilisable en clair et en sombre (axe de theming décrit dans `CLAUDE.md`), et responsive (mobile via `FilterSheet`, desktop via le panneau `aside`/flottant).

## Scope

### In Scope
- `components/MapClient.tsx` : suppression du titre, alignement du style du conteneur de filtres sur celui de `CatalogueClient.tsx`, ajout de l'action Export PDF.
- Éventuelle extraction d'une logique ou d'un sous-composant partagé si cela évite de dupliquer le code d'export PDF déjà présent dans `CatalogueClient.tsx`.

### Out of Scope
- Modification du comportement interne de `FilterBar`/`FilterSheet` (ils sont déjà partagés et corrects).
- Ajout de nouveaux filtres ou de nouvelles options de filtrage.
- Modification du rendu de la carte elle-même (`MapView.tsx`) au-delà de l'espace occupé par le panneau de filtres.

## Affected Areas
- `components/MapClient.tsx` — conteneur du panneau de filtres, titre à retirer, ajout de l'export PDF.
- `components/CatalogueClient.tsx` — source de référence pour le style du conteneur et la logique d'export PDF existante (à réutiliser, pas à réécrire).
- Potentiellement un nouveau module partagé (ex. `lib/exportPdf.ts` ou un composant dédié) si la logique d'export PDF actuellement inline dans `CatalogueClient.tsx` doit être partagée avec `MapClient.tsx` sans duplication.

## Edge Cases
- Aucun banc visible après filtrage sur la page Map : le bouton Export PDF doit se désactiver comme sur Catalogue (pas d'export vide).
- Export de la totalité des bancs (aucun filtre actif) sur la page Map : même confirmation ("Export all N benches as PDF?") que sur Catalogue.
- Écran étroit (mobile) : le panneau de filtres passe par `FilterSheet` sur les deux pages ; l'action Export PDF doit rester accessible aussi en mode mobile (à définir : dans la feuille de filtres ou ailleurs sur l'écran Map), pas seulement en desktop.

## Open Questions
- Sur mobile (`FilterSheet`), où doit apparaître le bouton Export PDF sur la page Map : à l'intérieur de la feuille de filtres (comme il pourrait être ajouté à `FilterSheet` pour les deux pages), ou ailleurs sur l'écran carte ? => oui sur FilterSheet

- Le texte de comptage sur Map ("X of Y shown on map") doit-il être reformulé pour correspondre exactement au format Catalogue ("X / Y lab test means"), ou une formulation légèrement différente adaptée au contexte carte est-elle acceptable ? => exactement au format catalog, en fait c'est le même composant

## Acceptance Criteria
- [ ] Le panneau de filtres de la page Map a la même apparence visuelle (habillage, style) que celui de la page Catalogue.
- [ ] Le titre "Lab test means by location" n'apparaît plus sur la page Map.
- [ ] L'action Export PDF est disponible et fonctionnelle sur la page Map, avec le même comportement (fichier généré, confirmation, désactivation si aucun résultat) que sur Catalogue.
- [ ] Aucune régression sur le filtrage ou l'export PDF existants de la page Catalogue.
- [ ] Comportement vérifié en clair et en sombre, en desktop et en mobile.
