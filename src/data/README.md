# Données des courses

Une course = un JSON de profil généré depuis sa trace GPX, déclaré dans `courses/index.ts`.

## Ajouter une course (ex. deuxième GPX)

1. Déposer la trace dans `traces/` (le GPX doit contenir l'altitude de chaque point ; les horodatages ne servent pas).
2. Générer le JSON :

   ```sh
   node scripts/gpx-to-course.mjs traces/COURSE_523287733.gpx --id nipalou-53km --name "Tour du Nipalou 53 km" --out src/data/courses/nipalou-53km.json
   ```

3. Le déclarer dans `courses/index.ts` :

   ```ts
   import nipalou53 from './nipalou-53km.json';
   // …
   { id: 'nipalou-53km', label: '53 km', source: 'Trace GPX 2025', officialDPlus: 2120, data: nipalou53 },
   ```

Dès qu'il y a deux courses, le sélecteur « Course » apparaît en haut de la page. Le temps visé est mémorisé séparément pour chaque course.

Courses actuelles : 21 km (trace 2024, D+ annoncé 1 020 m) et 53 km (trace Garmin « Nipalou 2025 », D+ annoncé 2 120 m, 2 124 m sur la trace).

## Format

```json
{ "id": "nipalou-21km", "name": "Tour du Nipalou 21 km", "lengthM": 20900.4, "ele": [822.6, 822.9, …] }
```

`ele` est le profil rééchantillonné à pas constant, 10 m environ (`lengthM / (ele.length - 1)`). Garder ce pas : le lissage et les seuils du calcul sont réglés pour lui. Le JSON ne contient pas les coordonnées.

Champs de `courses/index.ts` :

- `label` : libellé court (« 21 km »), utilisé dans le titre et le sélecteur.
- `source` : surtitre (« Trace GPX 2024 »).
- `officialDPlus` : D+ officiel annoncé, optionnel. S'il est présent, la section méthode affiche l'écart avec le D+ calculé sur la trace.

## Calcul

Voir `src/lib/pace-model.ts` (testé dans `pace-model.test.ts` avec les valeurs de contrôle de `.claude/INTEGRATION.md`).
