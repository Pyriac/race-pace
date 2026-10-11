# ElevationProfile

Profil altimétrique d'un parcours : aire `brand-soft`, tracé `brand` 2 px, ravitos en points `accent`, info-bulle au survol (altitude et kilomètre).

**Le consommateur fournit** : `points` en paires `[km, altitude en m]` (une mesure tous les 100 à 500 m suffit), `markers` (`{ km, label }` : ravitos, sommets, barrières horaires), `title`, `height` (défaut 240 px), `showStats` (bandeau Distance, D+, D−, Alt. max calculé à partir des points, activé par défaut).

Le composant prend toute la largeur de son conteneur et se redessine à la volée. Une seule échelle verticale, graduations arrondies à 50 ou 100 m, axes en `caption` `ink-muted`.

À faire : nommer les marqueurs en deux mots au plus. À éviter : comparer deux parcours sur le même graphique (faire deux profils côte à côte), lisser les données au point de fausser le D+.
