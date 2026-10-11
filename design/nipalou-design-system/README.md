Le Tour du Nipalou est une course de montagne hors catégorie et une randonnée, chaque dernier dimanche d'octobre à Lorcières, en Margeride (Cantal). Ce système garde l'élan d'un dossard épinglé — chiffres condensés, contrastes nets, rythme de course — mais le pose sur un sentier : verts de sapin et bruns d'ours adoucis, fonds papier chauds, angles arrondis. Sportif, jamais agressif.

## Principes

- **Le sentier avant le stade.** Couleurs désaturées, rayons généreux, ombres teintées terre. Pas de noir pur, pas de vert fluo, pas de dégradé.
- **Les chiffres portent l'énergie.** Distances, dossards, D+ et temps sont en `figure` ou `display` (Barlow Condensed). Le reste du texte reste calme.
- **Pratique d'abord.** Une page répond à « quand, où, combien, quelles pièces ? » avant de raconter.
- **Une seule action forte par écran.** Le bouton `accent` « S'inscrire » apparaît une fois ; tout le reste est `primary`, `secondary` ou `ghost`.

## Ton et écriture

Le site parle comme un comité d'organisation de village : accueillant, concret, ferme sur le règlement.

- Vouvoiement, phrases courtes, verbes d'action : « Retirez votre dossard à la salle des fêtes. »
- Les règles s'annoncent sans détour, préfixées de « Attention : » — exemple réel : « Attention : inscription sur place majorée 3€ pour les courses comme pour les randos. »
- Les randonneurs sont accueillis à égalité avec les coureurs : « Départ libre entre 9h00 et 10h30 sur la distance de leur choix. »
- Casse de phrase partout (titres, boutons, onglets). Les capitales sont réservées au surtitre `eyebrow`.
- Formats : `53 km` (espace insécable), `8h00`, `dimanche 25 octobre 2026`, `D+ 2 400 m`, temps `4:12:37`, prix `5 €`.
- Pas d'émoji. Un point d'exclamation au plus par page, pour l'arrivée ou les remerciements.
- Vocabulaire maison : course, rando, ravito, dossard, scratch, catégorie, Margeride, Nipalou.

## Couleur

Deux thèmes : **Jour** (le premier, par défaut) et **Nuit** (fond forêt de nuit, pour l'affichage le soir et le mode sombre). Utilisez toujours les jetons sémantiques ; les gammes `sapin`, `ours`, `terre`, `ciel`, `genet`, `brique` servent à composer de nouveaux jetons, pas à peindre directement.

- Page en `surface-100`, cartes en `surface-200`, bandeaux alternés en `surface-300`, pied de page en `surface-inverse` avec `ink-inverse`.
- Texte en `ink`, secondaire en `ink-muted`. Liens en `link`, toujours soulignés.
- `brand` (vert sapin adouci) est la couleur d'identité : bouton principal, tracé du profil, chiffres des cartes de course, bandeau du dossard. Texte posé dessus : `on-brand`.
- `accent` (brun ours adouci) est réservé à l'inscription et aux appels à l'action majeurs. Texte posé dessus : `on-accent`.
- `earth` donne du relief aux titres éditoriaux ; `earth-soft` aux encarts pratiques (accès, hébergement).
- `highlight` (jaune genêt) marque le podium et la première place, jamais du texte : le texte posé dessus est `on-highlight`.
- Statuts `success`, `warning`, `danger`, `info` : fond `*-soft`, texte de la même famille, et toujours une icône et un mot (« Confirmé », « Attention », « Erreur ») — `success` et `danger` ne se distinguent jamais par la seule teinte.
- Le logo garde ses couleurs d'origine, plus saturées (vert `#00693e`, brun `#9a3400`). Ne les reprenez pas en aplat d'interface : `brand` et `accent` en sont les versions adoucies, même teinte, chroma réduit de moitié.

Chaque couple texte/fond nommé dans les notes des jetons atteint 4,5:1 dans les deux thèmes ; bordures de champs (`line-strong`) et anneau de focus (`focus`) atteignent 3:1.

## Typographie

Deux familles Google Fonts, chargées par `<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">`.

- **Barlow Condensed** (`--font-display`) pour `display-xl`, `display`, `heading`, `figure`, `eyebrow`. Graisse 600 (700 pour `figure` seulement), en casse de phrase.
- **Barlow** (`--font-sans`) pour `title`, `body-lg`, `body`, `body-sm`, `label`, `caption`.
- Chiffres de résultats, temps et altitudes en `font-variant-numeric: tabular-nums`.
- Longueur de ligne 60–75 caractères ; `body` à 16 px minimum sur mobile.

## Espace, formes, profondeur

- Grille de 4 px : `space-1` à `space-16`. Cartes en `space-6`, notices en `space-5`, sections espacées de `space-16` (ordinateur) ou `space-10` (mobile).
- Largeur de contenu 1120 px, grille 12 colonnes, gouttière `space-6` ; une colonne et gouttière `space-4` sur mobile.
- Rayons : `radius-pill` pour boutons et tags, `radius-lg` pour cartes et panneaux, `radius-md` pour champs, notices et dossard, `radius-sm` pour les petits disques.
- Profondeur : cartes en `shadow-sm` avec filet `line`, `shadow-md` au survol et pour l'info-bulle. Pas d'autre ombre.
- Mouvement : 160 ms `ease-out` pour survols et focus, 240 ms pour l'ouverture d'un panneau. Pas de rebond. Respecter `prefers-reduced-motion`.

## États

- Survol : `brand` → `brand-hover`, `accent` → `accent-hover`, ligne de tableau → `surface-300`.
- Focus clavier : `box-shadow: var(--focus-ring)` sur tout élément interactif, jamais retiré.
- Désactivé : opacité 0,45, curseur `not-allowed`, pas de survol.
- Erreur de champ : bordure `danger`, message `danger` sous le champ avec icône.

## Iconographie

Le site n'a pas de jeu d'icônes propre. Le système utilise des pictogrammes au trait dans l'esprit de **Lucide** (trait 1,75 px, extrémités rondes, grille 24 px) — substitution choisie, à remplacer si l'organisation adopte un autre jeu. Le composant `Icon` en fournit une dizaine (`arrow-right`, `clock`, `mountain`, `map-pin`, `users`, `flag`, `info`, `circle-check`, `triangle-alert`, `circle-x`). Icônes en `currentColor`, 20 px dans le texte, 24 px seules. Pas d'émoji en guise d'icône.

## Logo et mascotte

Le logo est l'ours mascotte en tenue de course, dossard 15, devant des sapins (`assets/Logos`). Il se pose sur `surface-200` ou une photo claire, avec une marge d'au moins `space-6`. Ne le recolorez pas, ne l'étirez pas, ne détourez pas l'ours seul. Le fichier fourni est une capture d'écran basse définition : à remplacer par le fichier source dès que possible.

## Données de course

- Profils altimétriques : composant `ElevationProfile`, tracé `brand` 2 px sur aire `brand-soft`, grille `line`, axes en `caption` `ink-muted`, info-bulle au survol. Une seule échelle verticale.
- Résultats : composant `ResultsTable`, rangs 1 à 3 en disques (genêt, granit, ours), temps en chiffres tabulaires alignés à droite.

## Composants

`Button`, `Tag`, `Notice`, `Bib`, `RaceCard`, `ElevationProfile`, `ResultsTable`, `TextField`, `Icon` — exposés par `components/bundle.js` sous `window.Nipalou`, avec React 18. Classes CSS préfixées `np-` dans `components/bundle.css`.
