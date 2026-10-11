# ResultsTable

Tableau de classement : rang, dossard, nom, catégorie, club, temps, avec disques de podium pour les trois premiers.

**Le consommateur fournit** : `rows` (`{ rank?, bib, name, category, club?, time }` ; le rang est déduit de l'ordre s'il manque), `caption` (course et type de classement : « 53 km — scratch », « 21 km — féminines »), `podium` (défaut `true`).

- Rang 1 sur `genet-400`, rang 2 sur `terre-200`, rang 3 sur `ours-200`, texte `terre-900` : or, granit, bronze sans métal criard.
- Temps en Barlow Condensed tabulaire, alignés à droite, format `h:mm:ss`.
- Sous 560 px la colonne Club disparaît ; le conteneur défile horizontalement si besoin.

À éviter : colorer les lignes par catégorie, plus de 100 lignes sans pagination ni recherche.
