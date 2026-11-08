# Feature Spec: Functional code — affichage sur la fiche et recherche

## Summary
L'API REST du synchronizer (`GET /api/infos/labtestmeans` et `GET /api/infos/labtestmeans/{externalId}`) expose désormais un champ **`functionalCode`** pour chaque Lab Test Mean (modification dans `C:\projects\airbus\atom\7DAE-atom-synchronizer` : attribut `functionalCode` ajouté au domaine `LabTestMean` et lu dans les requêtes LeanIX `getLabTestMeans.gql` et `getLabTestMeanByExternalid.gql`).

Le dashboard doit :
1. **récupérer** ce champ via les appels REST existants ;
2. l'**afficher sur la fiche de détail** d'un banc, **sous l'externalId** ;
3. permettre de **retrouver un banc par la recherche** en tapant son **externalId** ou son **functionalCode**.

**Les appels restent en REST.** Aucune bascule vers GraphQL n'est faite ici (décision de l'utilisateur).

## Motivation
- Le functional code est l'identifiant métier que les équipes utilisent au quotidien pour désigner un banc. L'externalId, lui, est un identifiant technique LeanIX. Un utilisateur qui connaît un banc par son code doit pouvoir le trouver et le reconnaître sur sa fiche.
- La recherche du catalogue accepte déjà l'externalId. Le functional code doit l'être aussi, sinon les deux identifiants se comportent différemment.

## Requirements

### Functional Requirements

#### 1. Récupération
- Le champ `functionalCode` de la réponse REST est lu et porté par le modèle frontend d'un Lab Test Mean, aussi bien depuis la liste que depuis la fiche unitaire.
- Une valeur absente, `null` ou vide (après suppression des espaces) se lit « pas de functional code ». Ce n'est jamais une chaîne vide affichée ni une erreur.
- La valeur est conservée telle quelle (casse et format), seuls les espaces en tête et en fin sont retirés.

#### 2. Affichage sur la fiche de détail
- Maquette de référence : `temp/f1.jpg`. Dans l'en-tête de la fiche (`/labtestmean?id=…`), on trouve sous le nom du banc :
  1. la ligne des badges (statut, quality seal), qui ne porte plus l'externalId ;
  2. deux **pastilles d'identifiant** empilées, alignées à gauche : « **External Ref :** <externalId> », puis en dessous « **Functional Code :** <functionalCode> ».
- Chaque pastille porte une icône de lien en couleur d'accent, un fond teinté d'accent léger et une bordure fine d'accent. Le texte est en gras et la valeur en plus gras. Elle reste lisible en thème clair et en thème sombre.
- S'il n'y a pas de functional code, sa pastille n'apparaît pas du tout : pas de libellé orphelin, pas de tiret. Il en va de même pour l'externalId.

#### 3. Recherche
- Le champ de recherche du panneau de filtres partagé (Catalogue `/`, Carte `/map`, Dependency View `/depview`) trouve un banc par :
  - son **externalId** (déjà le cas, à conserver) ;
  - son **functionalCode** (nouveau).
- La correspondance suit la règle actuelle de cette recherche : insensible à la casse, et une saisie partielle suffit (sous-chaîne).
- Le texte d'aide du champ de recherche mentionne les codes, pour que l'utilisateur sache qu'il peut taper un code.
- Le sélecteur de bancs du Dependency Graph (`/depgraph`), qui cherche déjà par nom et externalId, cherche aussi par functional code, pour qu'un banc se retrouve de la même façon partout.
- La recherche de la liste des bancs masquables de la Dependency View, qui ne cherche aujourd'hui que par nom, cherche aussi par externalId et functional code, pour la même raison.

### Non-Functional Requirements
- **Aucun nouvel appel réseau** : le champ arrive avec les réponses REST déjà chargées.
- **Compatibilité :** si le synchronizer déployé n'envoie pas encore le champ, l'application fonctionne exactement comme avant, sans erreur. Seule la ligne de la fiche est absente.
- Lisible en thème clair et en thème sombre, cohérent avec le style de l'externalId.
- **Aucune régression** sur la recherche existante (nom, externalId, description, manager, programmes, projets), les autres filtres et leurs compteurs, ni sur l'en-tête de la fiche.

## Scope

### In Scope
- Lecture du champ `functionalCode` dans le contrat REST et dans le modèle frontend.
- Affichage sous l'externalId dans l'en-tête de la fiche de détail.
- Ajout du functional code (et de l'externalId là où il manque) aux trois recherches de bancs : panneau de filtres partagé, sélecteur du Dependency Graph, liste de visibilité de la Dependency View.
- Mise à jour du texte d'aide du champ de recherche.

### Out of Scope
- Toute migration des appels REST vers GraphQL.
- (Ajouté ensuite, à la demande : la carte de banc `LabTestMeanCard` du catalogue affiche le functional code en petit, en bas à droite, sur la ligne du statut.)
- L'affichage du functional code sur la carte (vue Map), les nœuds du Dependency Graph, la Dependency View, l'export PDF ou la page KPI (la page KPI lit LeanIX en GraphQL et n'est pas concernée).
- Un filtre dédié au functional code (liste de valeurs) : la recherche texte suffit.
- L'utilisation du functional code comme clé d'URL de la fiche : l'URL reste `/labtestmean?id=<externalId>`.
- Toute modification du synchronizer.

## Affected Areas
- `lib/atom-api.ts` : contrat `LabTestMeanDto` (nouveau champ optionnel).
- `lib/types.ts` : type `LabTestMean` (nouveau champ, absent = pas de code).
- `lib/labtestmean-adapter.ts` : normalisation de la valeur (espaces, vide → absent).
- `components/LabTestMeanHeader.tsx` : pastilles d'identifiant sous les badges (l'externalId quitte la ligne des badges).
- `components/icons/LinkIcon.tsx` : nouvelle icône de lien.
- `lib/labtestmeans.ts` : correspondance de la recherche (`matchesSearch`).
- `components/FilterBar.tsx` : texte d'aide du champ de recherche.
- `components/interaction/BenchCombobox.tsx` : correspondance du sélecteur de bancs.
- `components/radar/BenchVisibilityList.tsx` : correspondance de la liste de visibilité.
- Toute fixture ou donnée de test e2e Playwright construisant des `LabTestMean` ou des DTO, si le typage l'exige.

## Edge Cases
- **Champ absent de la réponse** (ancien synchronizer) : pas de ligne sur la fiche, recherche inchangée.
- **Valeur `null`, vide ou faite d'espaces** : traitée comme absente.
- **Functional code identique à l'externalId** : il est quand même affiché sur sa ligne libellée. Rien ne déduplique.
- **Plusieurs bancs partageant un même functional code** : la recherche les renvoie tous.
- **Saisie partielle** (« TLS-0 ») : renvoie tous les bancs dont l'externalId ou le functional code contient cette chaîne, selon la règle actuelle.
- **Casse différente** : `abc` trouve `ABC`.
- **Fiche ouverte depuis le cache de la liste puis rafraîchie par l'appel unitaire** : le functional code est le même dans les deux cas, sans clignotement de la ligne.
- **Recherche qui ne trouve rien** : même état vide qu'aujourd'hui.

## Acceptance Checklist
- [ ] Sur la fiche, les pastilles « External Ref » et « Functional Code » s'affichent sous les badges, conformément à `temp/f1.jpg`.
- [ ] Un banc sans functional code n'affiche aucune ligne vide.
- [ ] Taper un functional code complet ou partiel dans la recherche du Catalogue retrouve le banc ; idem sur la Carte et la Dependency View.
- [ ] Taper un externalId retrouve toujours le banc.
- [ ] Le sélecteur de bancs du Dependency Graph trouve un banc par son functional code.
- [ ] La liste de visibilité de la Dependency View trouve un banc par externalId et par functional code.
- [ ] Avec un synchronizer qui n'envoie pas le champ, aucune erreur et aucune régression.
- [ ] Thème clair et thème sombre vérifiés.
