# Feature Spec: Puces de filtre agrandies, teintées et porteuses d'un compteur

## Summary
Aligner le rendu des puces de valeur du panneau de filtres de `7DAE-ltm-dashboard` sur celui de l'application sœur `C:\projects\airbus\atom\7DAE-app-dashboard`, sur trois points visibles à l'œil nu (captures `temp/f1.jpg` — la référence — et `temp/f2.jpg` — l'état actuel) :

1. **Des puces plus grandes** : plus de rembourrage vertical et horizontal, coins plus arrondis, libellé pouvant passer à la ligne au lieu d'une simple bordure fine et d'une ligne unique.
2. **Un fond teinté** plutôt qu'une puce transparente cernée d'un trait : la puce inactive est un bloc bleu-gris plein, la puce active garde le bleu d'accentuation plein.
3. **Un compteur par valeur** : chaque puce affiche, alignée à droite, le nombre de LTM que cette valeur représenterait — c'est ce qui manque le plus aujourd'hui, l'utilisateur ne sachant pas à l'avance si cocher une case va beaucoup ou peu réduire la liste.

Cela concerne les chapitres à puces du panneau partagé (Type, Status, Country, Portfolio, Complexity) sur les trois pages qui le montrent : Catalogue, Map et Dependency View.

## Motivation
- Les puces actuelles (`px-2 py-0.5`, bordure fine, fond transparent) sont petites et peu lisibles dans un panneau de 340px ; les libellés longs sont tronqués, ce qui rend deux valeurs partageant un préfixe indiscernables, sans infobulle pour rattraper.
- Sans compteur, cocher une valeur est un pari : l'utilisateur découvre après coup qu'il vient de réduire la liste à zéro, ou qu'il n'a rien filtré du tout. La référence a résolu ce problème et l'écart est immédiatement visible entre les deux captures.
- Cette demande reprend le point qui avait été explicitement laissé **hors périmètre** de la spec `ux-parity-app-dashboard-filters-density-graph.md` (le mécanisme `previewCount` de la référence). C'est donc le complément direct de ce travail, sur un panneau désormais déjà unifié et partagé.

## Requirements

### Functional Requirements

#### 1. Géométrie des puces
- Rembourrage nettement plus généreux qu'aujourd'hui, et rayon d'angle plus marqué, de sorte que chaque valeur forme un bloc cliquable franc plutôt qu'une étiquette fine.
- Le libellé **passe à la ligne** au lieu d'être tronqué. Une puce qui prend deux lignes agrandit simplement sa rangée, et sa voisine suit — la grille reste alignée.
- Un nom très long et insécable doit être coupé proprement plutôt que déborder de la puce.
- La disposition en colonnes propre à chaque chapitre (Type sur deux rangées, Status/Country/Portfolio sur deux colonnes, Complexity sur une rangée) est conservée.

#### 2. Fond teinté
- La puce **inactive** a un fond plein bleu-gris, sans bordure marquée, comme sur `temp/f1.jpg`.
- La puce **active** garde un fond plein en couleur d'accentuation, avec un texte contrasté.
- Le survol reste distinguable des deux états, et l'anneau de focus clavier reste visible.
- Les deux états doivent rester lisibles en thème clair **et** en thème sombre ; le bleu vient des tokens de couleur existants, jamais d'une valeur codée en dur.

#### 3. Compteur par valeur
- Chaque puce affiche à sa droite le nombre de LTM correspondant à cette valeur.
- **Règle de calcul** : la valeur est mesurée **seule sur son axe**, les autres axes laissés tels quels. Autrement dit, cocher une deuxième valeur du même chapitre ne change aucun compteur de ce chapitre ; seul un filtre posé dans un **autre** chapitre les fait bouger. C'est un compteur de facette, pas une prévision du résultat du clic.
- Le compteur est aligné à droite, en chiffres à chasse fixe pour que les colonnes ne dansent pas, et reste hors du flux du texte pour ne pas bouger quand le libellé passe à la ligne.
- Le libellé réserve la place du compteur pour que les deux ne se chevauchent jamais.
- Le compteur reflète l'état courant des **autres** filtres, exclusions de bancs comprises, de sorte qu'il est toujours cohérent avec le compteur global du panneau.

#### 4. Portée
- S'applique aux chapitres à puces : Type, Status, Country, Portfolio, Complexity.
- Les chapitres qui ne sont pas des puces gardent leur rendu : les bascules trois états (Photo, Quality seal), l'arbre des programmes avion, et la liste à cases à cocher « Displayed LTM ».
- S'applique identiquement au panneau desktop et au tiroir mobile, qui montent le même composant.

### Non-Functional Requirements
- Aucune régression fonctionnelle sur le filtrage : cliquer une puce continue d'ajouter ou de retirer cette valeur de son axe (OU à l'intérieur d'un chapitre).
- Le calcul des compteurs ne doit pas dégrader sensiblement la réactivité du panneau sur le jeu de données réel. Il représente une passe de filtrage par valeur proposée, recalculée quand les options ou la sélection changent.
- Les puces restent utilisables au clavier et correctement annoncées : l'état sélectionné doit rester perceptible autrement que par la seule couleur.
- Le compteur ne doit pas casser la mise en page des libellés les plus longs du jeu de données réel (noms de portfolio, pays).

## Scope

### In Scope
- Rendu des puces de valeur du panneau de filtres : taille, rayon, fond, retour à la ligne.
- Ajout du compteur par valeur et de son mécanisme de calcul.
- Câblage de ce mécanisme sur les trois pages qui montent le panneau (Catalogue, Map, Dependency View), desktop et mobile.

### Out of Scope
- Modification des axes de filtre disponibles, de leur ordre, ou du comportement de pliage des chapitres.
- Modification du rendu des bascules trois états, de l'arbre des programmes avion ou de la liste « Displayed LTM ».
- Modification de la géométrie du panneau lui-même (largeur, position, cadre), acquise par la spec précédente.
- Ajout d'un compteur sur les bascules trois états ou sur l'arbre des programmes.
- Changement de la palette de l'application : les couleurs viennent des tokens existants.

## Affected Areas
- `components/FilterBar.tsx` — le composant interne de groupe de puces : géométrie, fond, retour à la ligne, affichage du compteur, et transmission d'un compteur par chapitre.
- `lib/useFilteredLabTestMeans.ts` — exposition d'une fonction de comptage « combien de LTM sous cette sélection hypothétique », cohérente avec le pipeline de filtrage déjà en place (axes grossiers puis exclusions).
- `components/CatalogueClient.tsx`, `components/MapClient.tsx`, `components/RadarClient.tsx` — passage de cette fonction au panneau et au tiroir mobile.
- `app/globals.css` / tokens de couleur — uniquement si le bleu-gris de la puce inactive n'est pas déjà exprimable avec un token existant.

## Edge Cases
- Une valeur dont le compteur vaut zéro : la puce reste cliquable et affiche `0`, plutôt que d'être masquée — la disparaître ferait vaciller la grille à chaque changement de filtre.
- Une valeur déjà sélectionnée : son compteur ne doit pas sauter au total non filtré, conséquence directe de la règle « mesurée seule sur son axe ».
- Libellés longs (noms de portfolio sans limite de longueur, pays) : la puce grandit en hauteur, le compteur reste en place.
- Compteurs à trois chiffres ou plus : la place réservée doit suffire sans repousser le libellé hors de la puce.
- Jeu de données vide ou backend indisponible : le panneau doit se rendre sans erreur, compteurs à zéro ou absents.
- Chapitre replié : aucun compteur n'est calculé inutilement pour un chapitre que personne ne regarde, si cela pèse.

## Open Questions
- Le compteur doit-il aussi apparaître sur les deux bascules trois états (Photo, Quality seal), où « la valeur seule sur son axe » a encore un sens, ou rester réservé aux puces comme sur la référence ?
- Le bleu-gris de la puce inactive doit-il être exactement le même token que la référence, ou s'accorder à la palette propre de `ltm-dashboard` si elle diffère ?
- Faut-il conserver une bordure discrète sur la puce inactive pour la séparer du fond du panneau en thème sombre, ou s'en remettre entièrement au contraste des fonds ?

## Acceptance Criteria
- [ ] Les puces de valeur sont nettement plus grandes qu'avant : rembourrage et rayon accrus, libellé sur plusieurs lignes si besoin plutôt que tronqué.
- [ ] La puce inactive a un fond plein bleu-gris ; la puce active un fond plein d'accentuation. Les deux sont lisibles en thème clair et sombre.
- [ ] Chaque puce des chapitres Type, Status, Country, Portfolio et Complexity affiche à droite le nombre de LTM correspondant à cette valeur.
- [ ] Ce nombre mesure la valeur **seule sur son axe** : cocher une deuxième valeur du même chapitre ne modifie aucun compteur de ce chapitre, alors qu'un filtre posé dans un autre chapitre les modifie.
- [ ] Le rendu est identique sur Catalogue, Map et Dependency View, sur le panneau desktop comme dans le tiroir mobile.
- [ ] Aucune régression sur le filtrage, le pliage des chapitres, « Clear All », ni sur les chapitres non concernés (bascules, arbre des programmes, Displayed LTM).
