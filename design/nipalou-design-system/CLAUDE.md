# Design system Tour du Nipalou : guide pour Claude Code

Ce dossier est le design system du site du Tour du Nipalou (trail à Lorcières, Margeride). Toute interface du projet doit s'y conformer.

## À lire avant de coder

1. `README.md` : la charte (principes, ton éditorial, couleurs, typo, espacements, états, iconographie). Elle prime sur tes réflexes par défaut.
2. `components/<Composant>/README.md` avant d'utiliser un composant : props, usages, à faire / à éviter.
3. `tokens.json` : la source de vérité de chaque valeur, avec une note `usage` par jeton qui dit où l'employer et sur quels fonds.

## Mise en place dans une page

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="nipalou-design-system/tokens.css">
<link rel="stylesheet" href="nipalou-design-system/components/bundle.css">
```

- Thème Jour par défaut ; thème Nuit avec `<html data-theme="dark">`. Pour suivre le système, basculer l'attribut selon `prefers-color-scheme`.
- Styles de texte : classes `.np-display-xl`, `.np-display`, `.np-heading`, `.np-figure`, `.np-eyebrow`, `.np-title`, `.np-body-lg`, `.np-body`, `.np-body-sm`, `.np-label`, `.np-caption`.

## Règles non négociables

- Jamais de couleur, taille, rayon ou ombre en dur : toujours `var(--jeton)`. Si une valeur manque, l'ajouter à `tokens.json` et `tokens.css`, ne pas l'inventer en ligne.
- Dans l'interface, utiliser les jetons sémantiques (`surface-*`, `ink*`, `brand*`, `accent*`, `earth*`, `highlight`, statuts). Les gammes `sapin-*`, `ours-*`, `terre-*`, `ciel-*`, `genet-*`, `brique-*` servent seulement à composer.
- Respecter les couples texte/fond nommés dans les notes `usage` (contraste AA garanti dans les deux thèmes). Texte sur aplat `brand` = `on-brand`, sur `accent` = `on-accent`, sur `highlight` = `on-highlight`.
- Un seul bouton `accent` (« S'inscrire ») par écran.
- Focus clavier visible partout : `box-shadow: var(--focus-ring)`.
- Statuts toujours avec icône et mot, jamais la couleur seule.
- Casse de phrase, vouvoiement, pas d'émoji ; formats `53 km`, `8h00`, `dimanche 25 octobre 2026`, temps `4:12:37`.
- Le logo (`assets/logo-tour-du-nipalou.png`) garde ses couleurs saturées d'origine ; ne pas en reprendre les teintes dans l'interface. C'est une capture basse définition à remplacer par le fichier source.

## Composants

Neuf composants : `Button`, `Tag`, `Notice`, `Bib`, `RaceCard`, `ElevationProfile`, `ResultsTable`, `TextField`, `Icon`.

- **Projet React** : `components/bundle.js` est un script classique qui expose `window.Nipalou` et lit `window.React` / `window.ReactDOM` (React 18). Types et props dans `components/index.d.ts`. Dans un projet avec bundler, tu peux aussi réécrire ces composants en modules à partir de `bundle.js`, en gardant les mêmes classes CSS.
- **Sans React** (HTML, template Joomla, PHP, Vue, Svelte…) : chaque `components/<Composant>/example.html` donne le balisage exact rendu par le composant. Reproduire ce balisage avec les classes `np-*` de `bundle.css`. Seul `ElevationProfile` demande du JS (le tracé SVG se calcule à partir des points `[km, altitude]`).
- `demo.html` montre tous les composants dans les deux thèmes ; ouvre-le pour vérifier le rendu.

## Arborescence

```
tokens.json              source de vérité des jetons
tokens.css               variables CSS (Jour + Nuit) et classes de texte .np-*
README.md                charte
components/bundle.css    styles des composants (classes np-*)
components/bundle.js     composants React → window.Nipalou
components/index.d.ts    props documentées
components/<C>/README.md consignes d'usage
components/<C>/example.html balisage statique
assets/                  logo et ses consignes
demo.html                vitrine des composants
```
