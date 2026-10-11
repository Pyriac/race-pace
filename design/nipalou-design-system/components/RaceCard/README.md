# RaceCard

Carte d'une course ou d'une rando : la distance en grand chiffre condensé, puis l'essentiel pratique et l'action.

**Le consommateur fournit** : `distance` et `unit` (défaut « km »), `title`, `tone` (couleur du chiffre : `brand` trails, `earth` courses jeunes, `info` randonnées, `accent` exceptionnel), `details` (`{ icon, label, value }`, deux à quatre lignes : départ, catégories, D+…), `tags` (trois au plus), `ctaLabel` / `ctaVariant` / `href` / `onCta`, et un lien secondaire `secondaryLabel` / `secondaryHref`.

Le conteneur fournit la grille : `repeat(auto-fit, minmax(260px, 1fr))`, gouttière `space-5`. Les cartes d'une même rangée s'alignent en hauteur, le pied de carte reste en bas.

À faire : un seul `ctaVariant: 'accent'` par écran — les autres cartes passent en `primary` ou `secondary`. À éviter : un paragraphe descriptif dans la carte (le mettre sur la page de la course), une bordure colorée sur le côté.
