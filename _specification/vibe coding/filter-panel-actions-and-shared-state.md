# Feature Spec: Chapitre "Actions" (export PDF en icône) + repli/persistance des filtres partagés Catalogue/Map

## Summary
- Analyse du projet de référence `C:\projects\airbus\atom\7DAE-app-dashboard` (board applicatif très proche de `ltm-dashboard`, mêmes fondations Next.js/`FilterBar`/`FilterSheet`) pour en reprendre deux évolutions déjà présentes là-bas :
  1. Un bloc **"ACTIONS"** en haut du panneau de filtres, avec l'export PDF présenté comme une **icône ronde** (bouton pilule avec tooltip), au lieu du bouton texte pleine largeur actuel de `ltm-dashboard`. Le bouton "Show in Discover" de la référence n'a **pas d'équivalent** dans `ltm-dashboard` et n'est **pas** repris pour l'instant.
  2. Chaque chapitre du bloc "FILTERING" (Photo, Quality seal, Type, Status, Country, Portfolio, Complexity, Aircraft programs) devient **repliable/dépliable** (accordéon), avec un **état d'ouverture par chapitre persisté** et **partagé entre toutes les instances montées du panneau** (desktop Catalogue, sheet mobile, panneau flottant Map).
  3. La **sélection de filtres elle-même** doit aussi être **partagée** entre la page Catalogue et la page Map — aujourd'hui elles ont chacune leur propre état (Catalogue : store en mémoire RAM réinitialisé par le clic sur "Catalogue" du header ; Map : `useState` local, perdu à chaque navigation).

## Motivation
- Cohérence visuelle et fonctionnelle avec l'autre board applicatif de la même famille (`7DAE-app-dashboard`), qui a déjà résolu ces deux problèmes.
- Le panneau de filtres de `ltm-dashboard` s'allonge (8 chapitres) sans aucun moyen de le replier : un utilisateur qui ne s'intéresse qu'à 1-2 axes doit scroller au milieu de tous les autres à chaque visite.
- Actuellement, appliquer un filtre sur la page Catalogue puis basculer sur `/map` perd totalement ce filtre (et inversement) — l'utilisateur doit re-sélectionner ses critères sur chaque page, ce qui est perçu comme un défaut alors que le `FilterBar` est déjà un composant partagé entre les deux pages.
- Le bouton Export PDF actuel (texte pleine largeur, "Export PDF (N)") prend une place disproportionnée dans le panneau comparé à la présentation compacte en icône de la référence.

## Décisions (arbitrées)
- **Pas de "Show in Discover"** pour l'instant : `ltm-dashboard` n'a pas d'équivalent à la page "Discover" du board applicatif ; seule l'action Export PDF est reprise dans le nouveau bloc "ACTIONS".
- Le bloc "ACTIONS" doit rester visible sur **les deux pages** (Catalogue et Map), puisque l'export PDF existe déjà des deux côtés depuis la dernière évolution (`lib/useExportPdf.ts` partagé).

## Requirements

### Functional Requirements

#### 1. Bloc "ACTIONS" avec icône Export PDF
- Ajouter, en haut du panneau de filtres (au-dessus du bloc "FILTERING" existant), un bloc de titre "ACTIONS" au même style visuel que les titres de bloc de niveau 1 de la référence (libellé en petites majuscules espacées).
- Sous ce titre, un bouton rond (icône PDF) remplace le bouton texte actuel : au survol/focus, une bulle d'info affiche le libellé complet et le nombre exact d'éléments concernés ("Export PDF (N)"), sans limite d'affichage à deux chiffres.
- Pendant la génération du PDF, l'icône bascule vers un indicateur de chargement (ex. icône de rafraîchissement animée), comme dans la référence.
- Le bouton reste désactivé quand 0 élément n'est visible ou qu'un export est déjà en cours, avec le même comportement de confirmation qu'aujourd'hui pour l'export de "tous" les éléments.
- Ce bloc "ACTIONS" doit apparaître aussi bien dans le panneau desktop que dans la feuille de filtres mobile (`FilterSheet`), sur Catalogue **et** sur Map.

#### 2. Chapitres de filtres repliables/dépliables
- Chaque chapitre du bloc "FILTERING" (Photo, Quality seal, Type, Status, Country, Portfolio, Complexity, Aircraft programs) devient une carte avec un en-tête cliquable : nom du chapitre, nombre de valeurs actuellement sélectionnées dans ce chapitre (si > 0), et un chevron indiquant l'état plié/déplié.
- Cliquer sur l'en-tête d'un chapitre replie ou déplie son contenu, sans perdre l'état interne de ce contenu (ex. un arbre "Aircraft programs" déjà partiellement développé ne doit pas se réinitialiser au repli/dépli).
- L'état plié/déplié de chaque chapitre est **mémorisé** (persisté d'une session à l'autre) et **partagé** entre toutes les instances du panneau actuellement montées (desktop, mobile, Map) — replier "Type" sur Catalogue le replie aussi sur Map.
- Par défaut (première visite, aucun état enregistré), tous les chapitres sont repliés.

#### 3. Partage de la sélection de filtres entre Catalogue et Map
- La sélection de filtres (recherche texte, tri-états Photo/Quality seal, Type, Status, Country, Portfolio, Complexity, programmes avion sélectionnés) devient une **source unique**, utilisée à la fois par la page Catalogue et par la page Map : un filtre appliqué sur l'une des deux pages s'applique immédiatement à l'autre.
- Cette sélection doit être **enregistrée** (survit au minimum à une navigation entre les deux pages ; idéalement à un rechargement de l'onglet, comme dans la référence qui utilise le stockage de session du navigateur).
- Le comportement existant de réinitialisation des filtres (aujourd'hui déclenché par le clic sur le lien "Catalogue" du header) doit rester disponible d'une manière ou d'une autre après ce changement — voir Open Questions pour arbitrer la mécanique exacte.

### Non-Functional Requirements
- Aucune régression sur le comportement d'export PDF déjà en place sur Catalogue et Map (nom de fichier, contenu du PDF, confirmation avant export "tout", désactivation à 0 résultat).
- Aucune régression sur la pagination de la page Catalogue (qui reste propre à cette page, contrairement aux filtres).
- Le panneau doit rester utilisable et lisible en clair et en sombre (axe de theming `CLAUDE.md`), en desktop et en mobile (via `FilterSheet`).
- Le repli/dépli des chapitres et le partage de la sélection ne doivent pas dépendre d'un aller-retour réseau : ce sont des états purement côté client.

## Scope

### In Scope
- Le panneau de filtres partagé (`FilterBar`/`FilterSheet`) et son intégration sur `CatalogueClient.tsx` et `MapClient.tsx`.
- L'ajout d'un bloc "ACTIONS" avec l'export PDF en icône (sans "Show in Discover").
- Le mécanisme de repli/dépli par chapitre, avec persistance et partage entre panneaux montés.
- Le passage de la sélection de filtres à une source unique partagée entre Catalogue et Map, avec une forme de persistance.

### Out of Scope
- Toute fonctionnalité de type "Show in Discover" ou équivalent — `ltm-dashboard` n'a pas de page Discover.
- Modification du contenu ou du calcul des filtres eux-mêmes (les axes disponibles restent Photo, Quality seal, Type, Status, Country, Portfolio, Complexity, Aircraft programs).
- Modification de la pagination de la page Catalogue.
- Toute évolution de la page `/depgraph` ou de son propre panneau de sélection de bancs (`BenchCombobox`/`SelectedBenchesBar`), qui n'utilise pas ce `FilterBar`.

## Affected Areas
- `components/FilterBar.tsx` — ajout des chapitres repliables et du bloc "ACTIONS".
- `components/FilterSheet.tsx` — vérifier que le nouveau bloc "ACTIONS" s'intègre correctement dans la feuille mobile existante (slot `extraContent` déjà utilisé pour l'export PDF côté `ltm-dashboard`).
- `components/CatalogueClient.tsx` et `components/MapClient.tsx` — passage à une source de filtres partagée, et adaptation de l'appel au nouveau bloc "ACTIONS".
- `lib/catalogueFilters.ts` — état actuel propre à Catalogue (RAM, reset par le header) à faire évoluer vers un état partagé Catalogue/Map.
- Nouveau module de persistance de l'état plié/déplié des chapitres (équivalent de `lib/filterSectionState.ts` côté référence).
- `components/ExportPdfButton.tsx` / `lib/useExportPdf.ts` (déjà en place suite à une évolution précédente) — logique réutilisée telle quelle, seul l'habillage visuel du déclencheur change.
- Un composant icône PDF (équivalent de `components/icons/PdfIcon.tsx` côté référence), absent aujourd'hui de `ltm-dashboard`.

## Edge Cases
- Un chapitre replié qui contient un axe déjà actif (ex. 2 pays sélectionnés) doit quand même afficher le nombre de valeurs actives sur son en-tête, pour qu'un filtre actif ne soit jamais "invisible" derrière un repli.
- Le chapitre "Aircraft programs" (arbre `TreeFilter`) doit conserver son propre état d'expansion interne indépendamment du repli/dépli du chapitre qui le contient.
- Storage indisponible (mode navigation privée, quota dépassé) : le repli/dépli et la sélection partagée doivent rester fonctionnels pour la session en cours, sans erreur bloquante, même si rien n'est persisté au rechargement (comportement de dégradation déjà en place dans `lib/catalogueFilters.ts`/`lib/photoCacheSettings.ts` de ce repo).
- Passage d'un filtre pays/type qui n'existe plus dans le jeu de données actuel (valeur orpheline stockée) : ne doit pas faire planter le panneau, doit simplement ne correspondre à aucun résultat.

## Open Questions
- Le comportement actuel du lien "Catalogue" du header, qui réinitialise aujourd'hui les filtres, doit-il être conservé tel quel une fois la sélection partagée avec Map ? Ou faut-il un bouton "Clear All" dédié dans le panneau (comme dans la référence), le lien "Catalogue" du header ne servant plus qu'à revenir sur la page sans toucher aux filtres ?
- Le stockage de la sélection de filtres partagée doit-il survivre à un rechargement de l'onglet (comme la référence, via le stockage de session du navigateur), ou rester volontairement en mémoire (perdu au reload), pour rester cohérent avec le choix actuel de `ltm-dashboard` (`lib/catalogueFilters.ts` est aujourd'hui en mémoire uniquement, contrairement à `lib/filterSectionState.ts`, qui lui utilise un stockage persistant) ?

## Acceptance Criteria
- [ ] Un bloc "ACTIONS" apparaît en haut du panneau de filtres sur Catalogue et sur Map (desktop et mobile), avec un bouton rond Export PDF affichant une bulle d'info au survol/focus (libellé + nombre exact).
- [ ] Aucune action "Show in Discover" ou équivalent n'apparaît.
- [ ] Chaque chapitre du bloc "FILTERING" peut être replié/déplié individuellement, avec un indicateur du nombre de valeurs actives visible même replié.
- [ ] L'état plié/déplié de chaque chapitre est identique entre le panneau desktop, la feuille mobile et le panneau Map, et persiste après un rechargement de la page.
- [ ] Appliquer un filtre sur Catalogue met à jour immédiatement le résultat affiché sur Map (et inversement), sans action supplémentaire de l'utilisateur.
- [ ] Aucune régression constatée sur l'export PDF existant (contenu, nom de fichier, confirmation, désactivation) ni sur la pagination de Catalogue.
