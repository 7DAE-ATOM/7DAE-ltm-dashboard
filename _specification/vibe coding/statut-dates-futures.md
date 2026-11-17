# Feature Spec: Statut opérationnel tenant compte des dates futures

## Summary
Le statut opérationnel d'un Lab Test Mean (Operational, In Project, Mothballed, Out of Service) n'est pas fourni par le backend. Le dashboard le **déduit des quatre dates du cycle de vie** que le synchronizer lit dans LeanIX (`kickoff`, `eisdateyear`, `mothballed`, `dismantled`) et renvoie par `GET /api/infos/labtestmeans`.

Aujourd'hui, la règle ne regarde que la **présence** d'une date, jamais sa **valeur**. Or ces dates peuvent être **planifiées dans le futur** : un banc dont le démantèlement est prévu en 2030 apparaît déjà « Out of Service », et un banc dont la mise en service est prévue l'an prochain apparaît déjà « Operational ».

Désormais, chaque date est **comparée à la date du jour**. Une date future signifie une étape **prévue**, pas une étape **atteinte**.

> **Libellés (renommés ensuite à la demande)** : Operational → **In Service**, Out of Service → **Dismantled**, Mothballed → **Mothballed**, In Project → **In Development**. Les clés internes (`operational`, `out-of-service`, `mothballed`, `in-project`) ne changent pas ; la suite de la spec emploie les anciens libellés.

## Motivation
- Le statut affiché est faux pour tout banc dont une étape est planifiée : il est classé d'après ce qui *arrivera* et non d'après ce qui *est*.
- L'erreur se propage partout où le statut est utilisé : badge des cartes et de la fiche, filtre « Status » et ses compteurs, carte, Dependency View, export PDF. Un utilisateur qui filtre sur « Operational » peut ne pas voir des bancs en service aujourd'hui, et voir des bancs qui ne le sont pas encore.
- La frise du cycle de vie de la fiche a le même défaut : elle affiche « Dismantled in 2030 » comme une étape franchie.

## Requirements

### Functional Requirements

#### 1. Étape atteinte, étape prévue
- Une étape du cycle de vie est **atteinte** si sa date est renseignée **et** antérieure ou égale à la date du jour.
- Elle est **prévue** si sa date est renseignée et postérieure à la date du jour.
- Elle est **non renseignée** si la date est absente ou vide.

#### 2. Règle du statut
Mêmes valeurs et même ordre de priorité qu'aujourd'hui ; seul « renseignée » devient « atteinte » :
1. démantèlement **atteint** → **Out of Service** ;
2. sinon, mise en sommeil **atteinte** → **Mothballed** ;
3. sinon, mise en service **non atteinte** (absente **ou** prévue) → **In Project** ;
4. sinon → **Operational**.

Conséquences :
- démantèlement prévu, mise en service atteinte → **Operational** ;
- mise en sommeil prévue → le banc garde son statut actuel (Operational ou In Project) ;
- mise en service prévue → **In Project**, même si un kickoff est passé.

#### 3. Granularité des dates
Les dates LeanIX peuvent être plus ou moins précises (`eisdateyear` contient souvent une **année seule**). La comparaison se fait **à la précision de la date fournie** :
- **année seule** (ex. « 2027 ») : atteinte à partir du 1er janvier de cette année ;
- **année et mois** : atteinte à partir du 1er jour de ce mois ;
- **date complète** : atteinte à partir de ce jour, inclus.
- Une date **illisible** (format inconnu) est traitée comme **atteinte**, c'est-à-dire comme aujourd'hui. Le statut ne change donc pas pour une donnée que l'on ne sait pas lire. Ce cas doit rester visible pour le développeur (trace en console), comme les autres valeurs inattendues de l'adaptateur.

#### 4. Date du jour
- La date du jour est celle du **navigateur de l'utilisateur**, au jour près (l'heure est ignorée).
- Elle est évaluée quand les données sont chargées ou rafraîchies (bouton de rafraîchissement du Header). Une page restée ouverte au passage de minuit se met à jour au prochain rafraîchissement ; aucun recalcul en continu n'est demandé.

#### 5. Frise du cycle de vie (fiche de détail)
- Une étape **atteinte** garde son affichage actuel (couleur, puce pleine, « Operational since … », « Dismantled in … »).
- Une étape **prévue** est affichée **distinctement** : pas en couleur pleine comme une étape franchie, avec un libellé explicite au futur, par exemple « Planned for <date> » (mise en service : « Planned entry into service: <date> » ; démantèlement : « Dismantling planned for <date> »).
- Une étape non renseignée garde son affichage actuel (« Not yet in service », « Still in service », …).
- Le badge de statut en tête de fiche et la frise disent toujours la même chose.

#### 6. Partout le même statut
Le statut est calculé en un seul endroit et utilisé tel quel par toutes les vues : cartes du catalogue, fiche, filtre « Status » et ses compteurs, carte, Dependency Graph, Dependency View, export PDF. Aucune vue ne refait son propre calcul.

### Non-Functional Requirements
- Aucun nouvel appel réseau ; aucune modification du synchronizer ni de la requête LeanIX.
- Le calcul reste instantané sur l'ensemble du catalogue.
- Lisible en thème clair et en thème sombre (notamment l'état « prévu » de la frise).
- **Aucune régression** pour les bancs dont toutes les dates renseignées sont passées : leur statut ne change pas.

## Scope

### In Scope
- La règle de dérivation du statut, comparée à la date du jour.
- La lecture des trois précisions de date (année, année-mois, date complète) et le traitement des dates illisibles.
- L'affichage « prévu » dans la frise du cycle de vie de la fiche.

### Out of Scope
- Un nouveau statut (ex. « Planned dismantling ») ou un indicateur « démantèlement prévu » sur les cartes : les quatre valeurs restent les mêmes.
- La page KPI, qui ne s'appuie pas sur ce statut (elle lit `lxState`).
- Toute correction des dates dans LeanIX ou dans le synchronizer.
- Le choix d'un fuseau horaire autre que celui du navigateur.

## Affected Areas
- `lib/labtestmean-adapter.ts` : règle `toStatus()` et lecture des dates.
- Un utilitaire de comparaison de date à la précision variable, voisin de `lib/format-date.ts` (qui sait déjà reconnaître une année seule).
- `components/detail/LifecycleSection.tsx` : état « prévu » et libellés au futur.
- Indirectement, sans modification attendue : `components/BadgeStatus.tsx`, filtre « Status » (`lib/labtestmeans.ts`, `components/FilterBar.tsx`), carte, vues de dépendances, `components/pdf/BenchDetailPage.tsx`.

## Edge Cases
- **Démantèlement prévu, en service aujourd'hui** → Operational ; la frise montre le démantèlement comme prévu.
- **Démantèlement passé et mise en service absente** → Out of Service (le démantèlement l'emporte, comme aujourd'hui).
- **Mise en sommeil passée, démantèlement prévu** → Mothballed.
- **Mise en sommeil prévue, mise en service passée** → Operational.
- **Mise en service prévue, kickoff passé** → In Project.
- **Mise en service = année en cours** (ex. « 2026 » en novembre 2026) → atteinte → Operational.
- **Mise en service = année prochaine** → In Project.
- **Date du jour exactement égale à la date** → atteinte.
- **Date illisible** → traitée comme atteinte ; signalée en console.
- **Date vide ou faite d'espaces** → non renseignée.
- **Page ouverte avant minuit et consultée après** → mise à jour au prochain chargement ou rafraîchissement.

## Acceptance Checklist
- [x] Un banc dont le démantèlement est prévu dans le futur et la mise en service passée s'affiche « Operational ».
- [x] Un banc dont la mise en service est prévue dans le futur s'affiche « In Project ».
- [x] Un banc dont toutes les dates sont passées garde son statut actuel.
- [x] Une année seule égale à l'année en cours compte comme atteinte.
- [ ] Le filtre « Status » et ses compteurs reflètent le nouveau statut sur le Catalogue, la Carte et la Dependency View.
- [ ] La frise de la fiche distingue une étape prévue d'une étape atteinte, avec un libellé au futur.
- [ ] Le badge de la fiche, la carte du catalogue et l'export PDF affichent le même statut.
- [ ] Thème clair et thème sombre vérifiés.
