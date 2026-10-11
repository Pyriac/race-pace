# Plan d'allure par section — intégration au site

Ce dossier contient de quoi reconstruire, dans le site, la page « Plan d'allure » : un coureur saisit son temps visé et obtient, pour chaque montée et chaque descente du parcours, un coefficient, une allure et un temps de passage.

> **Mise à jour : modèle km-effort (ITRA).** Le temps visé n'est plus réparti selon la courbe de coût Strava (`baseCost`, réglage `profile`) mais au prorata des km-effort : 1 km de distance vaut 1 km-effort, 100 m de D+ en ajoutent 1, le plat et la descente comptent autant. Le seul réglage personnel est `descentWeight`, le poids d'un kilomètre de descente (0,85 à 1,15).
>
> Dans le site, la référence est désormais `src/lib/pace-model.ts` et ses tests `src/lib/pace-model.test.ts`. Les fichiers `pace-model.mjs`, `pace-model.test.mjs` et `plan-allure-reference.html` de ce dossier décrivent **l'ancien modèle** et ne sont plus à jour. La page de référence reste valable pour la mise en page.

## Fichiers

| Fichier | Rôle | Emplacement conseillé |
|---|---|---|
| `pace-model.mjs` | Le calcul. Fonctions pures, sans DOM ni dépendance. | `src/lib/` |
| `pace-model.test.mjs` | Valeurs de contrôle (`node --test`). | à côté du module |
| `gpx-to-course.mjs` | Convertit un GPX en JSON de course. Node 18+, sans dépendance. | `scripts/` |
| `nipalou-21km.json` | Le profil du 21 km, produit par le script. | `src/data/courses/` ou `public/data/courses/` |
| `plan-allure-reference.html` | La page validée, autonome. Référence visuelle et de comportement. | hors du site, à consulter seulement |

Le module est en JavaScript avec des types JSDoc. Dans un projet TypeScript, le convertir en `.ts` ne demande que de reprendre les `@typedef` en interfaces.

## Architecture

Trois couches, à garder séparées :

1. **Données** : un JSON par course, généré depuis le GPX au moment du build ou une fois pour toutes.
2. **Calcul** : `pace-model.mjs`, identique pour toutes les courses.
3. **Interface** : un composant du site, écrit avec le design system Tour du Nipalou.

Tout le calcul se fait dans le navigateur. Rien n'est précalculé au-delà du profil, parce que le découpage et le profil du coureur sont des réglages de l'utilisateur. Un JSON pèse 13 Ko avant compression pour 21 km.

Ne pas intégrer la page de référence en `<iframe>` : elle embarque ses propres styles et ses données, et ne suivrait ni la navigation ni le thème du site.

## Ajouter une course

```sh
node scripts/gpx-to-course.mjs traces/53km.gpx --id nipalou-53km --name "Tour du Nipalou 53 km" --out src/data/courses/nipalou-53km.json
```

Le GPX doit contenir l'altitude de chaque point. Les horodatages ne servent pas. Format produit :

```json
{ "id": "nipalou-21km", "name": "Tour du Nipalou 21 km", "lengthM": 20900.4, "ele": [822.6, 822.9, …] }
```

`ele` est le profil rééchantillonné à pas constant, 10 m environ. Le pas exact vaut `lengthM / (ele.length - 1)`. Garder le pas de 10 m : le lissage et les seuils du calcul sont réglés pour lui.

Le JSON ne contient pas les coordonnées. Si le site affiche aussi une carte du tracé, c'est une donnée à ajouter à part.

## Utiliser le module

```js
import { prepareCourse, computePlan, sectionSchedule, formatHMS, formatMS } from './pace-model.mjs';
import course from './data/courses/nipalou-21km.json';

const prepared = prepareCourse(course);                                  // une fois par course
const plan = computePlan(prepared, { threshold: 20, descentWeight: 1 }); // à chaque changement de réglage
const schedule = sectionSchedule(plan, 9405);                            // à chaque changement de temps visé

schedule.rows[0];
// { index: 1, climb: true, startM: 0, endM: 4950.1, distM: 4950.1, dPlus: 426.6, dMinus: 25.2,
//   gradePct: 8.1, kmEffort: 9.22, coef: 1.28, share: 0.302, paceSecPerKm: 575, seconds: 2845, passageSeconds: 2845, … }
plan.kmEffort;                             // 30.47  km-effort ITRA du parcours
formatMS(schedule.flatPaceSecPerKm);       // "5:09"  allure sur le plat
formatMS(schedule.climb.paceSecPerKm);     // "10:05" allure moyenne en montée
formatMS(schedule.descent.paceSecPerKm);   // "5:25"  allure moyenne en descente
```

| Fonction | Usage |
|---|---|
| `prepareCourse(course)` | Lisse le profil, calcule pentes, D+, D−, altitudes min et max. |
| `computePlan(prepared, { threshold, descentWeight })` | Découpe en sections, calcule les coefficients et les km-effort (`plan.kmEffort`, `section.kmEffort`). Indépendant du temps visé. |
| `sectionSchedule(plan, totalSeconds)` | Allure, durée et temps de passage par section, moyennes montée et descente, et `flatPaceSecPerKm` (allure sur le plat). |
| `cost(pente, descentWeight)` | Km-effort d'un kilomètre sur une pente donnée. |
| `timeAtIndex(plan, totalSeconds, i)` | Temps de passage en un point du profil, pour l'info-bulle. |
| `indexAtDistance`, `sectionIndexAt`, `localGradePct` | Aides pour le survol du profil. |
| `flatPaceSecPerKm(plan, totalSeconds)` × `cost(pente, descentWeight)` | Allure sur une pente donnée, pour le tableau « Un kilomètre selon la pente ». |
| `parseDuration(texte, 'time' \| 'pace')` | Lit `2:36:45`, `2h36`, `7:30`, `7'30''`, `7,5`. Renvoie `null` si illisible. |
| `formatHMS`, `formatMS` | `2:36:45` et `7:30`. |

Réglages : `threshold` vaut 10, 20 ou 30 (`THRESHOLDS.fin`, `.moyen`, `.large`). `descentWeight` va de 0,85 (descendeur) à 1,15 (grimpeur) par pas de 0,05 (`DESCENT_WEIGHT`) ; 1 est la règle ITRA stricte. Son effet est progressif entre 0 et −9 % de pente (`FULL_DESCENT_GRADE`), entier au-delà ; les montées ne changent pas de poids. Les `kmEffort` du plan et des sections sont toujours la valeur ITRA, indépendante de `descentWeight`.

Règle de calcul : `cost(p) = 1 + p × 10 / 100` en montée (`CLIMB_M_PER_KM` = 100), `cost(p) = 1 + (descentWeight − 1) × min(1, −p / 9)` en descente. Le coût cumulé `cost × stepM` donne `coef` et `share` comme avant.

## Interface à reproduire

Se reporter à `plan-allure-reference.html` pour le rendu exact. Dans l'ordre de la page :

1. **Réglages** : temps visé et allure moyenne (deux champs synchronisés : modifier l'un recalcule l'autre avec `lengthM`), découpage Fin / Moyen / Large, curseur « Profil du coureur » à sept positions (−3 à +3, `descentWeight = 1 − 0,05 × position` : Grimpeur 1,15 à gauche, Descendeur 0,85 à droite). Message sous le curseur : « Équilibré : la descente compte comme le plat. », « Descendeur : 1 km de descente compte pour 0,85 km. », « Grimpeur : 1 km de descente compte pour 1,15 km. » (valeur courante). Les réglages mémorisés avant le passage au km-effort sont ignorés (nouvelle clé de stockage).
2. **Résumé** : allure moyenne (détail « 20,9 km en 2:36:45 · 5:09 sur le plat »), allure en montée, allure en descente.
3. **Profil** : altitude en fonction de la distance, aire et tracé colorés par section, numéro de section au-dessus, survol avec temps de passage, distance, altitude, pente et allure de la section. Survoler une section surligne sa ligne dans le tableau, et inversement. En-tête : distance, D+, D−, km-effort (30,5 pour le 21 km), altitude max.
4. **Tableau des sections** : n°, type, du km au km, distance, D+, D−, pente moyenne, km-effort (deux décimales, masqué sur mobile), coefficient, allure, durée, passage, puis une ligne de total (30,47 km-effort). Sous 640 px, chaque section s'empile en deux rangées de trois valeurs libellées, sans défilement horizontal.
5. **Méthode** (« Comment le temps est réparti ») : les quatre étapes du calcul, la formule « Temps de la section = km-effort × allure sur le plat », les limites, et le tableau « Un kilomètre selon la pente » (pente, km-effort, allure, de −20 % à +25 %).

Règles de saisie reprises de la page :

- Bornes acceptées : temps total entre 0:45:00 et 12:00:00.
- Une saisie invalide ne modifie rien pendant la frappe ; le message d'erreur n'apparaît qu'en quittant le champ et dit comment corriger.
- Les réglages sont mémorisés dans `localStorage`, avec repli silencieux si le stockage est indisponible.

### Design system

La page suit le design system Tour du Nipalou : Barlow Condensed pour titres et chiffres, Barlow pour le texte, jetons de surface, d'encre et de filet, champs de 44 px, cartes en `radius-lg`.

Deux écarts sont à connaître :

- **Montée et descente ont deux teintes**, composées à partir des gammes `ours` et `ciel` parce que le couple vert `brand` / brun `accent` se confond pour les daltoniens. À ajouter au design system si ces jetons doivent servir ailleurs :

  | Jeton | Jour | Nuit |
  |---|---|---|
  | `climb` | `#a76b4d` (ours-500) | `#a76b4d` (ours-500) |
  | `climb-soft` | `#f5e2d9` (ours-100) | `#3a261c` |
  | `descent` | `#3b566d` (ciel-700) | `#a3bbd0` (ciel-300) |
  | `descent-soft` | `#e5ecf3` (ciel-100) | `#1f2d39` |

  La teinte n'est jamais seule à porter l'information : chaque section a son numéro, une icône de pente et le mot « Montée » ou « Descente ».

- **Le composant `ElevationProfile` ne colore pas par section.** Il trace une aire `brand-soft` unique. Le profil du plan d'allure en est une variante à écrire : même grille, mêmes axes, même info-bulle, mais une aire et un tracé par section, séparés par un filet de 2 px de la couleur de surface.

## Document téléchargeable du plan

Le site propose de télécharger le plan pour l'avoir sous les yeux pendant la course : un document surtout textuel, les sections avec leur allure, et le profil en bas. Cette fonction n'existe pas dans la page de référence et n'a pas été vue en écrivant cette notice : ce qui suit fixe d'où viennent ses données, pas sa mise en forme.

- **Même source que le tableau.** Le document lit `sectionSchedule(plan, totalSeconds).rows`, avec le `plan` et le temps visé affichés à l'écran au moment du téléchargement. Ne rien recalculer ni réarrondir : `seconds` et `passageSeconds` sont déjà arrondis de façon que les durées retombent sur le temps visé, et le document doit donner exactement les chiffres de la page.
- **Une ligne par section, dans l'ordre du parcours.** Champs utiles : `index`, `climb`, `startM`, `endM`, `distM`, `dPlus`, `dMinus`, `kmEffort`, `paceSecPerKm`, `seconds`, `passageSeconds`. Exemple de ligne, avec `formatMS` et `formatHMS` :

  ```
  1 · Montée · km 0,0 → 5,0 · +427 m · 9,22 km-effort · 9:35 /km · passage 0:47:25
  ```

  **Choix retenu dans le site après les premiers tests** : chaque ligne ne garde que le pictogramme de pente, la distance cumulée en fin de section, le dénivelé de la section (+427 m / −257 m), la distance de la section et le passage (colonnes KM, DÉNIV., DIST., PASS.). Le type se lit sans couleur par la forme du pictogramme et le signe du dénivelé. Au-delà de 16 sections (53 km), la liste passe sur deux colonnes. Le bouton télécharge directement le PNG, sans feuille de partage.
- **En tête, les réglages** : course, temps visé, allure moyenne, km-effort du parcours, découpage, et le profil du coureur s'il n'est pas équilibré. Deux documents faits avec des objectifs différents doivent se distinguer sans la page.
- **Le nombre de lignes varie.** De 7 à 16 sur le 21 km selon le découpage, davantage sur un parcours plus long. Le profil reste en bas quelle que soit la longueur de la liste.
- **Profil en bas** : `prepared.alt` pour la courbe, les bornes `startIndex` / `endIndex` pour les sections, et les mêmes numéros que dans les lignes pour faire le lien entre texte et profil.
- **Rendu du profil.** S'il part du SVG de la page, les variables CSS et les polices web ne suivent pas dans un SVG exporté : écrire les couleurs en valeurs littérales et attendre `document.fonts.ready`. Prévoir un rendu clair fixe, indépendant du thème du site, lisible dehors et à l'impression.

## Valeurs de contrôle

`npm test` (fichier `src/lib/pace-model.test.ts`) doit passer. Pour le 21 km à 2:36:45 (7:30/km), découpage moyen, `descentWeight` à 1 :

| # | Type | Km-effort | Coef. | Allure | Passage |
|---|---|---|---|---|---|
| 1 | Montée | 9,22 | 1,28 | 9:35 | 0:47:25 |
| 2 | Descente | 4,42 | 0,76 | 5:43 | 1:10:10 |
| 3 | Montée | 0,51 | 1,52 | 11:22 | 1:12:47 |
| 4 | Descente | 1,33 | 0,69 | 5:11 | 1:19:38 |
| 5 | Montée | 1,41 | 1,26 | 9:26 | 1:26:54 |
| 6 | Descente | 0,18 | 0,69 | 5:09 | 1:27:50 |
| 7 | Montée | 1,30 | 1,72 | 12:52 | 1:34:31 |
| 8 | Descente | 1,99 | 0,72 | 5:24 | 1:44:46 |
| 9 | Montée | 3,65 | 1,74 | 13:03 | 2:03:34 |
| 10 | Descente | 2,89 | 0,70 | 5:14 | 2:18:25 |
| 11 | Montée | 2,17 | 1,06 | 7:57 | 2:29:33 |
| 12 | Descente | 1,40 | 0,70 | 5:15 | 2:36:45 |

Moyennes selon le profil :

| `descentWeight` | Allure sur le plat | En montée | En descente |
|---|---|---|---|
| 1,15 | 4:58 | 9:46 | 5:40 |
| 1,00 | 5:09 | 10:05 | 5:25 |
| 0,85 | 5:20 | 10:26 | 5:09 |

Aussi : `cost(0) = 1`, `cost(5) = 1,5`, `cost(10) = 2`, `cost(20) = 3`, `cost(-5) = 1`, `cost(-20) = 1` ; `cost(-9, 0.85) = 0,85`, `cost(-20, 0.85) = 0,85`, `cost(-4.5, 0.85) = 0,925`, `cost(10, 0.85) = 2` ; 16, 12 et 7 sections ; somme des durées = temps visé pour chaque seuil et chaque `descentWeight` ; somme des `kmEffort` des sections = `plan.kmEffort` = 30,47.

## Limites du modèle

- Effort supposé constant, sans fatigue ni arrêt aux ravitos.
- Le km-effort reflète la difficulté moyenne d'un parcours de trail, pas la technicité d'un chemin : une descente douce y compte autant qu'une descente raide.
- Le réglage « profil du coureur » est une correction simple, pas une donnée mesurée. Repère : Strava mesure en moyenne 0,88 dans les descentes les plus favorables.
- Le D+ calculé sur la trace du 21 km est de 957 m, contre 1 020 m annoncés : 30,5 km-effort au lieu de 31,1.
