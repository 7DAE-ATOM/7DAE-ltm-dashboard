# Feature Spec: kpi-lab-test-means

## Summary

Ajouter au LTM Board une page **KPI** (`/kpi`, entrée « KPI » du bandeau) qui montre la qualité des données des moyens d'essai (fact sheets **Solution** de LeanIX) :

1. une **barre de filtres** à neuf critères, à valeurs multiples ;
2. un **chiffre de périmètre** (« 124 of 180 Lab Test Means in scope ») ;
3. **six graphiques de répartition**, dont quatre cliquables comme des filtres ;
4. une **carte Photos** qui mesure la présence de photos sur les bancs ;
5. un **tableau** triable et paginé des bancs du périmètre.

Référence visuelle : le cadre « Statistics › Lab Test Means » (artboard `LTM-Tab`) de la maquette https://claude.ai/artifact/UtY5dwtPnQ2nKGKrLHYuYP, à reprendre telle quelle hors bandeau d'onglets (ici c'est une page). Données de la maquette fictives.

Cette page a d'abord été spécifiée comme un onglet de la page Statistics du cockpit ATOM (`7DAE-atom-cockpit/_specification/vibe coding/statistiques-onglet-lab-test-means.md`) ; elle vit finalement dans le LTM Board. Les réponses aux questions de cette première spec sont reprises ci-dessous.

## Motivation

Le catalogue du LTM Board montre les bancs un par un ; rien ne dit combien sont encore en DRAFT, combien n'ont ni plan de gestion de configuration, ni contrôle d'accès, ni photo, ni responsable, ni quelle part de leur fiche est renseignée. La page KPI donne cette vue d'ensemble, filtrable, puis la liste exacte des bancs à compléter, là où l'effort paie le plus.

## Requirements

### Functional Requirements

#### A. Page

1. Une route `/kpi` et une entrée **KPI** dans le bandeau, après « Dependency View ».
2. **Filtres et tri du tableau sont dans l'URL** : un lien partagé montre la même vue, un rechargement ne perd rien, les valeurs par défaut n'apparaissent pas dans l'adresse. Paramètres : `portfolio`, `country`, `type`, `shared`, `program`, `ata`, `ec`, `complexity`, `seal` (listes séparées par « | »), `order`.
3. Les filtres de la page KPI sont **indépendants** de ceux du catalogue, de la carte et de la Dependency View (mémorisés en session) : l'une ne modifie jamais les autres.

#### B. Données

4. Les Lab Test Means sont **toutes** les fact sheets `Solution` (aucune exclusion), lues par le **proxy GraphQL en lecture seule du synchronizer** (`POST /api/leanix/graphql/query`) — le proxy GraphQL a vocation à remplacer les routes REST ; la route `/api/infos/labtestmeans` ne porte ni la complétion, ni `shared`, ni `cmpAvailability`, ni `partIS`.
5. **Pagination complète** : toutes les pages sont suivies avant d'afficher quoi que ce soit, avec une borne haute de sécurité (100 pages). Un `errors[]` non vide dans une réponse 200 est une **erreur**. Aucune donnée partielle n'est présentée comme complète.
6. Champs lus : identité (`id`, `name`, `externalId`), `category`, `complexity`, `lxState`, `country`, `completion.percentage`, `ecLevel`, `shared`, `cmpAvailability`, `accesscontrol`, `partIS`, `documents.documentType`, et les relations `relSolutionToPortfolio`, `relWorkOnSolutionToAircraftStructure`, `relSolutionToATA`, `relLTMmanagerSolutionToUsers`, `relLtmProMngSolutionToUsers` (noms des fiches liées).
7. **Mêmes lectures que le catalogue** : type par `TYPE_MAP` (casse ignorée) avec les libellés SIMULATOR, SIB, FIB, **R&T**, SHARED RESOURCE ; quality seal par `toLxTag` (APPROVED et BROKEN_QUALITY_SEAL → RELEASE, sinon DRAFT) ; pays par `COUNTRY_MAP` ; complexité Simple / Medium / Complex. Export control : `notListed` Not Listed, `dualUse` Dual Use, `military` Military, `bothMilitaryAndDualUse` Both. `shared`, `cmpAvailability`, `accesscontrol`, `partIS` : oui / non. Une valeur inconnue est affichée telle quelle.
8. **Une photo** est un document de type `image` ou `photo`, casse ignorée — la règle du catalogue.
9. Chargement **une fois par session** (SWR), rafraîchi par le bouton « Refresh data » du bandeau ; seulement quand la page KPI est visitée. Filtrer, cliquer un graphique, trier ou paginer n'appelle jamais le backend.
10. **Valeur absente = « Not set »**, une valeur à part entière : sa propre part dans les graphiques, filtrable, en italique orange.

#### C. Filtres

11. Neuf filtres, dans cet ordre : Portfolio, Country, LTM Type, Shared, Aircraft Program, ATA, Export control level, Complexity, Quality seal. Pas de filtre Part IS applicability : `partIS` est lu mais pas encore renseigné dans LeanIX.
12. Plusieurs valeurs par filtre (**OU**), filtres combinés en **ET** ; Portfolio, Aircraft Program et ATA sont multivalués : un banc est retenu s'il porte au moins une valeur choisie.
13. Pastilles supprimables des choix actifs, bouton « Reset all ». Les listes ne proposent que les valeurs présentes dans les données.

#### D. Graphiques

14. Six graphiques :

    | Graphique | Champ | Forme | Filtre |
    | --- | --- | --- | --- |
    | Quality Seal | `lxState` | anneau | Quality seal |
    | Configuration management plan | `cmpAvailability` | anneau | aucun |
    | LTM Access Control | `accesscontrol` | anneau | aucun |
    | LTM Type Repartition | `category` | barres | LTM Type |
    | LTM Complexity Repartition | `complexity` | barres | Complexity |
    | LTM Export Control | `ecLevel` | barres | Export control level |

15. Le titre de la carte n'affiche pas le nom du champ LeanIX. Seuls les graphiques filtrants portent l'étiquette « Filter » ; les autres n'en ont aucune. Une note n'apparaît que lorsqu'une valeur est choisie (« Filtering on … »). Par valeur : nombre de bancs et pourcentage ; l'anneau porte le total en son centre.
16. Un clic sur une part ou une barre d'un graphique filtrant ajoute la valeur au filtre, un second clic l'en retire.
17. Chaque graphique compte le périmètre filtré par les autres critères, **sans le sien** : la valeur choisie est surlignée, les autres estompées, à leur vraie taille.
18. La couleur n'est jamais le seul repère (libellé, nombre, pourcentage) ; chaque élément cliquable est un bouton accessible au clavier qui annonce s'il est sélectionné.

#### E. Carte Photos

19. Carte pleine largeur : pourcentage de bancs ayant au moins une photo, nombre de bancs illustrés, nombre total de photos, moyenne par banc illustré ; quatre tuiles **No photo** (orange), **1 photo**, **2–4 photos**, **5+ photos**.
20. **Pas un filtre** (sans étiquette ni nom de champ) : les tuiles ne filtrent pas. Elle compte le périmètre (tous filtres appliqués).

#### F. Tableau

21. Les bancs du périmètre, colonnes : Name (lien vers `/labtestmean?id=<externalId>`, ouvert dans un nouvel onglet ; texte simple sans externalId), External ID, Portfolio, Photos (orange à 0), LTM Manager, LTM Project Manager, Quality seal (badge), Completion (barre orange < 50 %, bleu clair 50–89 %, bleu ≥ 90 %, et pourcentage).
22. Tri par clic sur l'en-tête, second clic inverse ; ▲/▼ et `aria-sort`. Défaut : complétion croissante. « Not set » toujours en dernier ; à égalité, par nom.
23. Pagination 10 / 25 / 50 / 100, taille **mémorisée par le navigateur** ; la page revient à 1 quand le périmètre, le tri ou la taille change.

#### G. États

24. Squelettes pendant le chargement ; une erreur est levée vers l'écran d'erreur de l'application (diagnostic, « Try again »), comme sur toutes les pages.
25. Notes d'avertissement si la borne de pagination est atteinte, si des fiches sans id / nom sont écartées, ou si des complétions illisibles comptent 0 %.

## Scope

### In Scope

- La page `/kpi` et son entrée de bandeau ; le premier client GraphQL de l'application ; la clé de rafraîchissement.

### Out of Scope

- Toute écriture dans LeanIX.
- Le cockpit ATOM (son onglet Lab Test Means reste en l'état, à décider plus tard).
- La correction du `tailwind.config.ts` (les modificateurs d'opacité `bg-accent/10`… ne génèrent rien dans cette application ; la page KPI ne les utilise pas).
- Un export du tableau ; l'historique.

## Affected Areas

| Zone | Nature de l'intervention |
| --- | --- |
| `app/kpi/page.tsx` | Nouvelle route, sous `<Suspense>` (lecture de l'adresse). |
| `components/kpi/` | La page (`KpiClient`), ses filtres, graphiques, carte Photos, tableau, pagination, couleurs. |
| `lib/kpi/` | Lecture paginée, requête et validation, hook SWR, calculs purs, préférence de taille de page, listes d'URL. |
| `lib/useUrlState.ts` | Porté du cockpit : état dans l'adresse. |
| `lib/atom-api.ts` | `postLeanixQuery()` ; délai d'attente paramétrable. |
| `lib/labtestmean-adapter.ts` | `TYPE_MAP` et `toLxTag` exportés. |
| `components/Header.tsx`, `components/RefreshButton.tsx` | Entrée KPI ; rafraîchissement de la clé KPI. |
| `app/globals.css` | Couleurs des types (`--color-ltm-*`), animation des barres. |

## Edge Cases

| Cas | Comportement attendu |
| --- | --- |
| Échec d'une page de la pagination / `errors[]` | Écran d'erreur ; jamais de chiffres partiels. |
| Borne de pagination atteinte | Affichage, avec un avertissement explicite. |
| Pré-requête CORS refusée alors que les GET passent | Écran d'erreur « backend down » ; suspecter le traitement `OPTIONS` du proxy. |
| Complétion absente ou hors 0–100 | Comptée 0 % et signalée. |
| `category` / `country` inconnus | Affichés tels quels. |
| `documentType` en casse inattendue | Compté comme photo. |
| Valeur de filtre dans l'URL inconnue des données | Ignorée. |
| Aucun banc ne passe les filtres | Graphiques vides lisibles ; tableau « No Lab Test Mean matches these filters. » |
| Écran étroit | Graphiques en une colonne ; le tableau défile dans sa carte, jamais la page. |
| Mode sombre | Lisible ; couleurs issues des jetons du thème. |
| Réduire les animations | Aucune animation. |

## Open Question

1. **Budget de temps** : 30 s par page, non mesuré — à mesurer lors du premier appel réel.
2. **Relations tronquées** : si LeanIX coupe la liste des documents ou d'une relation d'un banc, le nombre de photos (ou de responsables) est sous-estimé sans être signalé ; faut-il demander `totalCount` sur ces relations ?

## Acceptance Criteria

- [ ] `/kpi` est accessible depuis l'entrée KPI du bandeau et affiche filtres, périmètre, six graphiques, carte Photos et tableau conformément à la maquette.
- [ ] Les données viennent du proxy GraphQL, toutes pages suivies, une fois par session ; « Refresh data » les recharge.
- [ ] Filtres multi-valeurs (OU / ET) ; quatre graphiques filtrent au clic, deux et la carte Photos ne filtrent pas ; chaque graphique compte sans son propre filtre.
- [ ] Tableau triable (« Not set » en dernier) et paginé ; le nom ouvre la fiche du banc.
- [ ] Filtres et tri dans l'URL ; les filtres des autres pages ne sont pas affectés.
- [ ] Types, quality seal, pays, complexité et photos se lisent comme dans le catalogue.
- [ ] Rendu correct en clair et en sombre, sur écran étroit, au clavier.
- [ ] `npx tsc --noEmit`, `npm run lint` et `npm run build` passent.
